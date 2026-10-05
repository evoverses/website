const { it } = require("node:test");
const assert = require("node:assert/strict");
const f = require("./fixtures.cjs");
const { projectSnapshot, groupRegistryEvents } = f.load("nursery/projection");
const { nurseryConfig } = f.load("nursery/config");
const { assertLegacyBreedingAllowed } = f.load("legacy-breeding-policy");
const id = "43114-" + f.collection + "-101";
const project = (reader, previous, seed = f.seed, at = f.block(), hatchedAt) =>
  projectSnapshot(id, f.hatcher, 101n, at, reader, previous, seed, hatchedAt);

it("imports adult traits without inventing XP or original birth dates; maps legacy zero-based nature/gender", async () => {
  const a = await project(f.reader(0), undefined, null);
  assert.equal(a.metadata.type, "EVO");
  assert.equal(a.metadata.gender, "male");
  assert.equal(a.metadata.nature, "dauntless");
  assert.equal(a.metadata.attack, 23);
  assert.equal(a.metadata.xp, undefined);
  assert.equal(a.metadata.created_at, undefined);
});
it("creates an egg from its emitted token/species/generation and versioned pool, without adultOf", async () => {
  const a = await project(
    f.reader(1, false, {
      adult: async () => {
        throw new Error("must not read unhatched adult");
      },
    }),
  );
  assert.equal(a.id, id);
  assert.equal(a.metadata.species_id, 13);
  assert.equal(a.metadata.generation, 1);
  assert.equal(a.metadata.type, "EGG");
  assert.equal(a.metadata.parent1_token_id, "1");
  assert.equal(a.metadata.primary_type, "fire");
});
it("treatment and hatch request retain the original offspring history", async () => {
  const first = await project(f.reader());
  const treated = await project(f.reader(1, true), first, null, f.block(11));
  const pending = await project(f.reader(2, true), treated, null, f.block(12));
  assert.equal(pending.metadata.treated, true);
  assert.equal(pending.metadata.egg_status, 2);
  assert.equal(pending.metadata.species_id, 13);
  assert.equal(pending.metadata.created_at, first.metadata.created_at);
});
it("hatching publishes actual adult stats/Epic and preserves token, parents and creation time", async () => {
  const first = await project(f.reader());
  const a = f.adult({ generation: 1n, totalBreeds: 0n });
  a.attributes = { ...a.attributes, gender: 0n, rarity: 2n, nature: 20n };
  const hatched = await project(
    f.reader(3, true, { adult: async () => a }),
    first,
    null,
    f.block(20),
    f.block(20).timestamp,
  );
  assert.equal(hatched.metadata.type, "EVO");
  assert.equal(hatched.metadata.rarity, "epic");
  assert.equal(hatched.metadata.chroma, "none");
  assert.equal(hatched.metadata.gender, "female");
  assert.equal(hatched.metadata.nature, "loyal");
  assert.equal(hatched.metadata.created_at, first.metadata.created_at);
  assert.equal(hatched.metadata.attack, 23);
  assert.equal(
    hatched.metadata.hatched_at,
    new Date(f.block(20).timestamp).toISOString(),
  );
});
it("chroma is distinct from Epic", async () => {
  const a = f.adult();
  a.attributes = { ...a.attributes, rarity: 1n };
  const row = await project(f.reader(0, false, { adult: async () => a }));
  assert.equal(row.metadata.chroma, "chroma");
  assert.equal(row.metadata.rarity, "unknown");
});
it("deduplicates events, sorts blocks, and refreshes both parent counters on egg recording", () => {
  const minted = f.event("EggRecorded", 101n, 12, 1, f.seed);
  const groups = groupRegistryEvents([
    minted,
    f.event("AdultImported", 1n, 10),
    minted,
    f.event("EggTreated", 101n, 12, 2),
  ]);
  assert.deepEqual(
    groups.map((g) => g.block.height),
    [10, 12],
  );
  assert.equal(groups[1].tokens.size, 3);
  assert.equal(groups[1].tokens.get("101").seed.species, 13n);
});
it("assigns authoritative counters on replay and never overwrites them with an older block", async () => {
  const first = await project(
    f.reader(0, false, { adult: async () => f.adult() }),
  );
  const replay = await project(
    f.reader(0, false, { adult: async () => f.adult() }),
    first,
  );
  assert.equal(replay.metadata.total_breeds, 7);
  assert.deepEqual(replay, first);
  assert.strictEqual(await project(f.reader(), first, null, f.block(9)), first);
});
it("requires rollback before replacing a same-height fork, but accepts a restored earlier snapshot", async () => {
  const first = await project(f.reader());
  await assert.rejects(
    project(f.reader(), first, f.seed, {
      ...f.block(),
      hash: "0x" + "a".repeat(64),
    }),
    /Rollback/,
  );
  const restored = { ...first, blockNumber: 9 };
  assert.equal((await project(f.reader(), restored)).blockNumber, 10);
  assert.throws(
    () =>
      groupRegistryEvents([
        f.event("EggTreated"),
        { ...f.event("EggTreated"), hash: "0x" + "b".repeat(64) },
      ]),
    /forks/,
  );
});
it("fails closed on missing history, impossible state/traits, registry replacement and RPC failure", async () => {
  await assert.rejects(project(f.reader(), undefined, null), /EggRecorded/);
  await assert.rejects(project(f.reader(3), undefined, null), /EggHatched/);
  await assert.rejects(project(f.reader(4)), /egg state/);
  const a = f.adult();
  a.attributes = { ...a.attributes, gender: 2n };
  await assert.rejects(
    project(f.reader(0, false, { adult: async () => a })),
    /gender/,
  );
  await assert.rejects(
    project(f.reader(), {
      id,
      hatcher: f.collection,
      blockNumber: 9,
      blockHash: "",
      metadata: {},
    }),
    /Registry changed/,
  );
  await assert.rejects(
    project(
      f.reader(1, false, {
        egg: async () => {
          throw new Error("RPC failure");
        },
      }),
    ),
    /RPC failure/,
  );
});
it("unimported legacy NFTs are left to the existing metadata path", async () => {
  assert.equal(
    await project(f.reader(0, false, { known: async () => false })),
    undefined,
  );
});
it("configuration requires the chain, all deployment settings and transfer indexing", () => {
  assert.equal(nurseryConfig({}), undefined);
  const env = {
    CHAIN_ID: "43114",
    NFT_ADDRESSES: f.collection,
    NURSERY_HERMANN_ADDRESS: f.hatcher,
    NURSERY_EVO_ADDRESS: f.collection,
    NURSERY_FROM_BLOCK: "10",
  };
  assert.deepEqual(nurseryConfig(env), f.config);
  for (const change of [
    { BREEDING_BACKEND: "legacy-brenda" },
    { CHAIN_ID: "1" },
    { NFT_ADDRESSES: "" },
    { NURSERY_FROM_BLOCK: "-1" },
    { NURSERY_EVO_ADDRESS: "" },
    { NURSERY_HERMANN_ADDRESS: "0x" + "0".repeat(40) },
  ])
    assert.throws(() => nurseryConfig({ ...env, ...change }));
});
it("legacy off-chain randomness/token allocation is opt-in and cannot coexist with Hermann", () => {
  assert.throws(() => assertLegacyBreedingAllowed({}), /disabled/);
  assert.doesNotThrow(() =>
    assertLegacyBreedingAllowed({ BREEDING_BACKEND: "legacy-brenda" }),
  );
  assert.throws(
    () =>
      assertLegacyBreedingAllowed({
        BREEDING_BACKEND: "legacy-brenda",
        NURSERY_HERMANN_ADDRESS: f.hatcher,
      }),
    /disabled/,
  );
});
