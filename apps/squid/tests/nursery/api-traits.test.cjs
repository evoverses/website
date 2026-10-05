const { it } = require("node:test");
const assert = require("node:assert/strict");
const { load } = require("./fixtures.cjs");
const { breedingMetadataTraits, metadataImageVersion } =
  load("api-nursery-traits");
it("NFT metadata exposes unlimited Gen0 breeds and capped other-generation remaining breeds", () => {
  assert.deepEqual(
    breedingMetadataTraits({
      generation: 0,
      totalBreeds: 100,
      rarity: "unknown",
    }),
    [{ trait_type: "Breeds Remaining", value: "Unlimited" }],
  );
  assert.equal(
    breedingMetadataTraits({
      generation: 1,
      totalBreeds: 4,
      rarity: "unknown",
    })[0].value,
    1,
  );
  assert.equal(
    breedingMetadataTraits({
      generation: 2,
      totalBreeds: 5,
      rarity: "unknown",
    })[0].value,
    0,
  );
});
it("Epic is exposed as rarity, without changing chroma or ordinary metadata", () => {
  assert.deepEqual(
    breedingMetadataTraits({
      generation: 1,
      totalBreeds: 0,
      rarity: "epic",
    })[1],
    { trait_type: "Rarity", value: "Epic" },
  );
  assert.equal(
    breedingMetadataTraits({ generation: 1, totalBreeds: 0, rarity: "unknown" })
      .length,
    1,
  );
});
it("image versions change on treatment, hatching or XP updates and restore on rollback", () => {
  const egg = { type: "EGG", treated: false, xp: 0 };
  const version = metadataImageVersion(egg);
  for (const update of [{ treated: true }, { type: "EVO" }, { xp: 1 }])
    assert.notEqual(metadataImageVersion({ ...egg, ...update }), version);
  assert.equal(metadataImageVersion({ ...egg }), version);
  assert.match(version, /^[0-9a-f]{20}$/);
});
