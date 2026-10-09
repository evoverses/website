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
            metadata: {
              species: "kitsul",
              type: "EVO",
              xp: 30,
              nature: "loyal",
              gender: "female",
              attack: 25,
              special: 25,
              defense: 25,
              resistance: 25,
              speed: 25,
            },
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
  // Kitsul starts at its former L10 HP, rather than the retired fixed 50 HP.
  assert.equal(got.entries[0].traits.currentHealth, 25);
  assert.equal(got.entries[0].traits.values.health, 25);
  assert.ok(got.entries[0].traits.level < 100);
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

test("targeted combat metadata works beyond the first page and still verifies chain ownership",async()=>{
 let pageReads=0,verified=[];
 const make=owner=>createGameLinkedInventoryReader({links:{projection:async()=>projected},projection:shared.walletProjection,load:shared.loadLinkedNfts,sources:()=>({
  fetchIndexed:async()=>{pageReads++;throw Error('not a page read');},
  fetchByIds:async ids=>ids.map(tokenId=>({chainId:'43114',address:'0x4151b8afa10653d304fdac9a781afccd45ec164c',owner:address,tokenId,metadata:{species:'kitsul',type:'EVO',xp:0,nature:'loyal',gender:'female',attack:25,special:25,defense:25,resistance:25,speed:25}})),
  readChain:async(_,ids)=>{verified=ids;return {owners:ids.map(()=>owner),counts:[100n]};},
 })});
 const got=await make(address)('synthetic',{tokenIds:['2253']});assert.equal(got.entries[0].tokenId,'2253');assert.deepEqual(verified,['2253']);assert.equal(pageReads,0);
 assert.equal((await make(other)('synthetic',{tokenIds:['2253']})).entries.length,0);
 await assert.rejects(make(address)('synthetic',{tokenIds:['2253','2253']}),/Invalid linked selection/);
});
