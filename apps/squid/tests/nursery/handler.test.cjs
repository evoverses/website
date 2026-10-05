const { it } = require("node:test");
const assert = require("node:assert/strict");
const f = require("./fixtures.cjs");
const { parseNurseryEvents, processNurseryEvents } = f.load(
  "handlers/asset/nursery",
);
const { registryReader } = f.load("nursery/reader");
const { NurseryEvo } = f.load("model");
const { events, functions } = f.load("abi/generated/hatcher-hermann");
const { events: nftEvents } = f.load("abi/erc721");
function log(topic, address = f.hatcher, tokenId = 101n, data = "0x") {
  return {
    address,
    topics: [topic, "0x" + f.word(tokenId)],
    data,
    block: f.block(),
    logIndex: 1,
  };
}
it("decodes only trusted registry/collection events from the configured deployment block", () => {
  const raw = log(
    events.EggRecorded.topic,
    f.hatcher,
    101n,
    f.encoded([1, 2, 13, 1]),
  );
  const parsed = parseNurseryEvents(
    [raw, { ...raw, address: f.collection }, { ...raw, block: f.block(9) }],
    f.config,
  );
  assert.equal(parsed.length, 1);
  assert.deepEqual(parsed[0].seed, f.seed);
  assert.equal(parsed[0].tokenId, 101n);
  const update = {
    ...log(nftEvents.MetadataUpdate.topic, f.collection),
    topics: [nftEvents.MetadataUpdate.topic],
    data: f.encoded([101]),
  };
  assert.equal(
    parseNurseryEvents([update], f.config)[0].name,
    "MetadataUpdate",
  );
  assert.deepEqual(parseNurseryEvents([raw]), []);
});
it("pins every registry call to the event's canonical hash and caches versioned pools", async () => {
  const rpc = f.rpcFixture();
  const r = await registryReader(rpc.client, f.config, f.block());
  assert.equal(await r.known(101n), true);
  assert.equal((await r.egg(101n)).status, 1);
  assert.equal((await r.species(2n, 13n)).primaryType, 2n);
  await r.species(2n, 13n);
  assert.equal(
    rpc.calls.filter(
      (c) =>
        c.method === "eth_call" &&
        c.params[0].data.startsWith(functions.getSpeciesPool.selector),
    ).length,
    1,
  );
  for (const c of rpc.calls.filter((c) => c.method === "eth_call"))
    assert.deepEqual(c.params[1], {
      blockHash: f.block().hash,
      requireCanonical: true,
    });
});
it("rejects wrong-chain, miswired-registry and unavailable historical reads", async () => {
  const rpc = f.rpcFixture();
  await assert.rejects(
    registryReader({ call: async () => "0x1" }, f.config, f.block()),
    /wrong chain/,
  );
  await assert.rejects(
    registryReader(
      {
        call: async (method) =>
          method === "eth_chainId" ? "0xa86a" : f.encoded([0]),
      },
      f.config,
      f.block(),
    ),
    /different NFT/,
  );
  await assert.rejects(
    registryReader(
      {
        call: async (method) => {
          if (method === "eth_chainId") return "0xa86a";
          throw new Error("pruned block");
        },
      },
      f.config,
      f.block(),
    ),
    /pruned block/,
  );
});
it("persists egg and canonical parent counts once, including duplicate event replay", async () => {
  const rows = new Map();
  const events = [
    f.event("EggRecorded", 101n, 10, 1, f.seed),
    f.event("MetadataUpdate"),
  ];
  let ctx = f.context(rows);
  await processNurseryEvents(ctx, events, f.config);
  await ctx.entities.save(NurseryEvo);
  assert.equal(rows.size, 3);
  assert.equal(
    rows.get("43114-" + f.collection + "-1").metadata.total_breeds,
    7,
  );
  assert.equal(rows.get("43114-" + f.collection + "-101").metadata.type, "EGG");
  ctx = f.context(rows);
  await processNurseryEvents(ctx, [...events, ...events], f.config);
  await ctx.entities.save(NurseryEvo);
  assert.equal(rows.size, 3);
  assert.equal(
    rows.get("43114-" + f.collection + "-1").metadata.total_breeds,
    7,
  );
});
it("retains egg history through treatment, hatch request and final hatch in the actual handler", async () => {
  const rows = new Map();
  async function run(event, status, treated) {
    const ctx = f.context(rows, f.rpcFixture(status, treated).client);
    await processNurseryEvents(ctx, [event], f.config);
    await ctx.entities.save(NurseryEvo);
  }
  await run(f.event("EggRecorded", 101n, 10, 0, f.seed), 1, false);
  await run(f.event("EggTreated", 101n, 11), 1, true);
  await run(f.event("HatchRequested", 101n, 12), 2, true);
  assert.equal(
    rows.get("43114-" + f.collection + "-101").metadata.egg_status,
    2,
  );
  await run(f.event("EggHatched", 101n, 20), 3, true);
  const adult = rows.get("43114-" + f.collection + "-101").metadata;
  assert.equal(adult.type, "EVO");
  assert.equal(adult.parent2_token_id, "2");
  assert.equal(adult.attack, 23);
});
it("a failed later block stages no partial metadata writes from the batch", async () => {
  const rpc = f.rpcFixture();
  const ctx = f.context(new Map(), {
    call: async (method, args) => {
      if (method === "eth_call" && args[1].blockHash === f.block(11).hash)
        throw new Error("historical RPC failure");
      return rpc.client.call(method, args);
    },
  });
  await assert.rejects(
    processNurseryEvents(
      ctx,
      [
        f.event("EggRecorded", 101n, 10, 0, f.seed),
        f.event("EggTreated", 101n, 11),
      ],
      f.config,
    ),
    /historical RPC failure/,
  );
  assert.deepEqual(ctx.entities.values(NurseryEvo), []);
});
