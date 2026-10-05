const { it } = require("node:test");
const assert = require("node:assert/strict");
const f = require("./fixtures.cjs");
process.env.NURSERY_HERMANN_ADDRESS = f.hatcher;
process.env.NURSERY_EVO_ADDRESS = f.collection;
process.env.NURSERY_FROM_BLOCK = "10";
delete process.env.BREEDING_BACKEND;
const { parseMetadataUpdateEvent } = f.load("handlers/asset/nfts");
const { events } = f.load("abi/erc721");
it("the shared metadata topic cannot reclassify the configured Evo collection as ERC1155", () => {
  const deferred = [];
  const ctx = {
    entities: { defer: (...args) => deferred.push(args) },
    log: { warn() {} },
  };
  const event = parseMetadataUpdateEvent(ctx, {
    address: f.collection,
    topics: [events.MetadataUpdate.topic],
    data: f.encoded([101]),
    block: f.block(),
  });
  assert.equal(event.type, "ERC721");
  assert.equal(event.fromTokenId, 101n);
  assert.equal(deferred.length, 2);
});
