"use strict";
// Display-only projection of the game's immutable, versioned move catalogues.
// Run after a reviewed game catalogue change; --check never writes files.
const fs = require("node:fs"), path = require("node:path"), assert = require("node:assert/strict"), { createHash } = require("node:crypto");
const canonical = value => Array.isArray(value) ? `[${value.map(canonical).join(",")}]` : value && typeof value === "object" ? `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical(value[k])}`).join(",")}}` : JSON.stringify(value);
const digest = value => createHash("sha256").update(canonical(value)).digest("hex");
function project(gameRoot) {
  const catalogues = {};
  for (const version of [1, 2]) {
    const source = `Content/Store/Data/move-learning-v${version}.json`;
    const { sha256, ...body } = JSON.parse(fs.readFileSync(path.join(gameRoot, source), "utf8"));
    assert.equal(digest(body), sha256, `${source}: source digest`);
    assert.equal(body.version, `move-choices-v${version}`);
    assert.equal(body.protocol, version);
    assert.equal(Object.keys(body.species).length, 68);
    const species = Object.fromEntries(Object.entries(body.species).map(([key, entry]) => {
      const ids = [...entry.starters, ...Object.values(entry.groups).flat()];
      assert.equal(entry.starters.length, 4, `${key}: starters`);
      assert.equal(new Set(ids).size, ids.length, `${key}: duplicate moves`);
      assert.ok(ids.every(id => Number.isSafeInteger(id) && id > 0 && body.moves[id]?.name), `${key}: move definitions`);
      return [key, { starters: entry.starters, groups: entry.groups }];
    }));
    catalogues[body.version] = { source, sourceSha256: sha256, species, moveNames: Object.fromEntries(Object.entries(body.moves).map(([id, move]) => [id, move.name])) };
  }
  const body = { schemaVersion: 1, catalogues };
  return { ...body, sha256: digest(body) };
}
if (require.main === module) {
  const args = process.argv.slice(2), gameRoot = args.find(a => a !== "--check") || process.env.EVOVERSES_ACCOUNT_TEST_REPO;
  if (!gameRoot) throw Error("Supply the game repository path, optionally with --check");
  const result = project(path.resolve(gameRoot)), target = path.resolve(__dirname, "../src/data/move-learning.json");
  const legacy = JSON.parse(fs.readFileSync(path.join(gameRoot, "Content/Store/Data/evo-progression.json"), "utf8"));
  const legacyTarget = path.resolve(__dirname, "../src/data/evo-progression.json");
  // XP curves and legacy cohorts must remain in sync alongside choice cohorts.
  if (args.includes("--check")) assert.deepEqual(JSON.parse(fs.readFileSync(legacyTarget, "utf8")), legacy, "Website legacy progression differs from the game");
  else fs.writeFileSync(legacyTarget, JSON.stringify(legacy, null, 2) + "\n");
  if (args.includes("--check")) assert.deepEqual(JSON.parse(fs.readFileSync(target, "utf8")), result, "Website move catalogues differ from the game; run sync-move-learning.cjs");
  else fs.writeFileSync(target, JSON.stringify(result, null, 2) + "\n");
  console.log(`Move catalogue ${args.includes("--check") ? "check" : "sync"} passed: ${Object.keys(result.catalogues).join(", ")}`);
}
module.exports = { project, digest };
