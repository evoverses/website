"use strict";
const { test } = require("node:test"),
  assert = require("node:assert/strict");
const {
  compiledInventory,
  createGameLinkedInventoryReader,
} = require("../../scripts/game-linked-inventory.cjs");
const shared = compiledInventory();
const address = "0x" + "a".repeat(40),
  other = "0x" + "b".repeat(40),
  wallet = {
    id: "11111111-1111-1111-1111-111111111111",
    chainId: 43114,
    address,
    label: "0xaaaa…aaaa",
  };
const projected = { wallets: [wallet], version: "a".repeat(64) };
function reader({
  owner = address,
  nextPage = null,
  warnings = false,
  after = projected,
} = {}) {
  let calls = 0;
  return createGameLinkedInventoryReader({
    links: { projection: async () => (++calls === 1 ? projected : after) },
    load: shared.loadLinkedNfts,
    projection: shared.walletProjection,
    sources: () => ({
      fetchIndexed: async () => ({
        items: [
          {
            chainId: "43114",
            address: "0x4151b8afa10653d304fdac9a781afccd45ec164c",
            owner: address,
            tokenId: "7",
            metadata: { species: "kitsul", type: "EVO", xp: 30 },
          },
        ],
        total: 1,
        nextPage,
      }),
      readChain: async () => {
        if (warnings) throw Error("private details");
        return { owners: [owner], counts: [1n] };
      },
    }),
  });
}
test("shared loader returns freshly owned NFT with masked wallet only", async () => {
  const got = await reader()("synthetic session");
  assert.equal(got.entries[0].tokenId, "7");
  assert.equal(got.entries[0].walletLabel, wallet.label);
  assert.equal(got.entries[0].experience, 30);
  assert.equal(got.available, true);
  assert.equal(got.partial, false);
  assert.ok(!JSON.stringify(got).includes(address));
});
test("transferred NFTs disappear and remaining indexed pages are explicit", async () => {
  const got = await reader({ owner: other, nextPage: 1 })("synthetic");
  assert.deepEqual(got.entries, []);
  assert.equal(got.partial, true);
});
test("ownership outage never publishes cached NFTs", async () => {
  const got = await reader({ warnings: true })("synthetic");
  assert.deepEqual(got.entries, []);
  assert.equal(got.available, false);
});
test("unlink during read discards the whole linked projection", async () => {
  const got = await reader({ after: { wallets: [], version: "b".repeat(64) } })(
    "synthetic",
  );
  assert.deepEqual(got, { entries: [], partial: true, available: false });
});
test("authentication failure in final projection propagates", async () => {
  let calls = 0;
  const load = createGameLinkedInventoryReader({
    links: {
      projection: async () => {
        if (++calls === 2) throw Error("INVALID_SESSION");
        return projected;
      },
    },
    load: shared.loadLinkedNfts,
    projection: shared.walletProjection,
    sources: () => ({
      fetchIndexed: async () => ({ items: [], total: 0, nextPage: null }),
      readChain: async () => ({ owners: [], counts: [0n] }),
    }),
  });
  await assert.rejects(load("synthetic"), /INVALID_SESSION/);
});
