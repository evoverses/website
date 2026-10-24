const { it } = require("node:test");
const assert = require("node:assert/strict");
const f = require("./fixtures.cjs");
const { parseNftEvents, processTransferEvents } = f.load("handlers/asset/nfts");
const { NFT, Chain } = f.load("model");
const { events } = f.load("abi/erc721");
const zero = "0x" + "0".repeat(40);
const bertha = "0x" + "b".repeat(40);
const owner = "0x" + "a".repeat(40);
const topic = address => "0x" + address.slice(2).padStart(64, "0");
function transfer(from, to, index) {
  return { address: f.collection, topics: [events.Transfer.topic, topic(from), topic(to), "0x" + f.word(5109n)], data: "0x", block: f.block(), logIndex: index };
}
it("indexes mint-to-Bertha followed by delivery as one NFT owned by the breeder, including replay", () => {
  const ctx = f.context();
  ctx.chain = new Chain({ id: "43114" });
  const parsed = parseNftEvents(ctx, [transfer(zero, bertha, 1), transfer(bertha, owner, 3)]);
  assert.equal(parsed.transferEvents.length, 2);
  assert.equal(parsed.transferEvents[0].to, bertha);
  assert.equal(parsed.transferEvents[1].from, bertha);
  processTransferEvents(ctx, parsed.transferEvents);
  const key = ctx.entities.toId(f.collection, 5109n);
  const nft = ctx.entities.get(NFT, key, false);
  assert.equal(nft.owner.address, owner);
  assert.equal(nft.tokenId, 5109n);
  processTransferEvents(ctx, parsed.transferEvents);
  assert.equal(ctx.entities.get(NFT, key, false), nft);
  assert.equal(nft.owner.address, owner);
});
