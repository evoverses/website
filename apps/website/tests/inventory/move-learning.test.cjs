"use strict";
const { test } = require("node:test"), assert = require("node:assert/strict"), path = require("node:path");
const base = process.env.EVOVERSES_INVENTORY_TEST_LIB;
const { parseCombat, combatDetails } = require(path.join(base, "lib/player/inventory/combat.js"));
const { nftProgression, parseEvoStats } = require(path.join(base, "lib/player/inventory/evo.js"));
const { ordinaryInventory } = require(path.join(base, "lib/player/inventory/model.js"));
const { createPlayerWebAuth } = require(path.join(base, "lib/player/auth-core.js"));
const snapshot = require("../../src/data/move-learning.json"), legacy = require("../../src/data/evo-progression.json");
const id = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", key = `account:${id}`;
const metadata = { xp: 0, nature: "loyal", gender: "female", attack: 25, special: 25, defense: 25, resistance: 25, speed: 25 };
const policy = snapshot.catalogues["move-choices-v2"];
function state(species = "nissel", learned = policy.species[species].starters, version = "move-choices-v2", xp = 0) {
  const level = nftProgression(species, { ...metadata, xp }).level;
  return { resourceKey: key, currentHealth: 0, maxHealth: 50, version: 17, recoverAt: "2026-10-29T13:00:00.000Z", level, experience: xp,
    equipped: learned.slice(0, 4), moves: learned.map((id, i) => ({ id, remaining: i % 43, maximum: 42, equipped: i < 4 })),
    learning: { resourceKey: key, revision: 1, catalogueVersion: version, learned, paused: false, pending: null } };
}
function evo(combat = state()) {
  const entry = legacy.species.nissel;
  const genes = Object.fromEntries(Object.keys(entry.baseStats).map(k => [k, 25]));
  return { id, speciesKey: "nissel", experience: 0, displayId: "E-0000000042", breedable: false, generation: null,
    stats: { schemaVersion: 1, level: 1, experience: 0, baseStats: entry.baseStats, genetics: genes,
      trainingPoints: Object.fromEntries(Object.keys(genes).map(k => [k, 0])), values: entry.baseStats, nature: "Loyal", gender: "Female", size: 0,
      currentHealth: entry.baseStats.health, moves: Object.entries(entry.moves).filter(([, level]) => level === 1).slice(0, 4).map(([id]) => Number(id)) }, combat };
}
test("Epic account response retains v2 learned starters and renders the profile without the reported crash", async () => {
  const flow = createPlayerWebAuth({ configuration: () => ({ apiUrl: "http://127.0.0.1:50999", clientId: "fixture", clientSecret: "synthetic", applicationId: "fixture", deploymentId: "fixture" }), fetchImpl: async () => Response.json({ items: [], evos: [evo()] }) });
  const inventory = await flow.readInventory("a".repeat(64));
  assert.deepEqual(inventory.evos[0].combat.learning.learned, policy.species.nissel.starters);
  const row = ordinaryInventory(inventory)[0];
  assert.equal(row.details.combatVerified, true);
  assert.equal(row.details.currentHealth, 0);
  assert.equal(row.details.combatVersion, 17);
  assert.equal(row.details.recoverAt, state().recoverAt);
  assert.deepEqual(row.details.moves.filter(m => m.unlocked).map(m => m.id).sort((a, b) => a - b), [...policy.species.nissel.starters].sort((a, b) => a - b));
  assert.equal(row.details.moves.find(m => m.id === 9008).name, policy.moveNames[9008]);
  assert.equal(row.details.moves.find(m => m.id === 4001).remainingPP, 0);
});
test("all 68 species use their pinned v1/v2 choice collections and never auto-learn eligible moves", () => {
  for (const [version, catalogue] of Object.entries(snapshot.catalogues)) for (const [species, rules] of Object.entries(catalogue.species)) {
    for (const level of [1, 5, 20, 35, 50, 65, 80, 100]) {
      const xp = level === 1 ? 0 : Math.round(level ** 3 * legacy.species[species].maxXp / 1000000);
      const eligible = Object.entries(rules.groups).filter(([gate]) => Number(gate) <= level).flatMap(([, ids]) => ids);
      const learned = [...rules.starters, ...eligible.slice(0, level === 100 ? eligible.length : 1)];
      const input = state(species, learned, version, xp);
      const details = combatDetails(nftProgression(species, { ...metadata, xp }), parseCombat(input), species);
      assert.deepEqual(details.moves.filter(m => m.unlocked).map(m => m.id).sort((a, b) => a - b), [...learned].sort((a, b) => a - b), `${version}:${species}:${level}`);
      assert.equal(details.moves.length, rules.starters.length + Object.values(rules.groups).flat().length);
      for (const m of details.moves) {
        assert.equal(m.choice, true);
        assert.equal(m.name, learned.includes(m.id) ? catalogue.moveNames[m.id] : "New move");
        if (!learned.includes(m.id)) { assert.equal(m.remainingPP, undefined); assert.equal(m.maximumPP, undefined); assert.equal(m.equipped, false); }
      }
    }
  }
});
test("learning validation rejects wrong identity, version, duplicate/foreign moves and inconsistent PP sets", () => {
  const input = state();
  for (const learning of [false, [], { ...input.learning, resourceKey: "account:foreign" }, { ...input.learning, catalogueVersion: "move-choices-v999" }, { ...input.learning, learned: [4001, 4001, 7016, 7008] }, { ...input.learning, learned: [4001] }, { ...input.learning, learned: [...input.learning.learned, 4023] }]) {
    assert.throws(() => parseCombat({ ...input, learning }));
  }
  const wrong = state("nissel", [...policy.species.nissel.starters, 2147483647]);
  assert.throws(() => combatDetails(nftProgression("nissel", metadata), parseCombat(wrong), "nissel"));
  assert.throws(() => combatDetails(nftProgression("nissel", metadata), parseCombat(input), "nuvea"));
  assert.equal(parseCombat({ ...input, learning: null }).learning, undefined);
});
test("an inconsistent Evo retains its holding while other cards still load, without exposing unverified moves", () => {
  const broken = evo(state("nissel", [...policy.species.nissel.starters, 2147483647]));
  const rows = ordinaryInventory({ items: [{ productId: "vital_dew", revision: 1, quantity: 3 }], evos: [broken, { ...evo(), id: "ffffffff-ffff-4fff-8fff-ffffffffffff" }] });
  assert.equal(rows.length, 3);
  assert.equal(rows[1].id, `evo:${id}`);
  assert.equal(rows[1].details, undefined);
  assert.equal(rows[1].detailsUnavailable, true);
  assert.equal(rows[2].details.combatVerified, true);
});
test("ordinary profiles use current combat XP as NFT profiles do, without changing immutable birth stats", () => {
  const xp = Math.round(20 ** 3 * legacy.species.nissel.maxXp / 1000000), value = evo(state("nissel", policy.species.nissel.starters, "move-choices-v2", xp));
  const row = ordinaryInventory({ items: [], evos: [value] })[0];
  assert.equal(row.details.level, 20);
  assert.equal(row.xp, xp);
  assert.equal(value.stats.experience, 0);
  assert.equal(parseEvoStats(value.stats, "nissel").level, 1);
});
test("website catalogue snapshot is reproducible from the game and has a verified projection digest", () => {
  const { digest, project } = require("../../scripts/sync-move-learning.cjs");
  const { sha256, ...body } = snapshot;
  assert.equal(digest(body), sha256);
  if (process.env.EVOVERSES_ACCOUNT_TEST_REPO) assert.deepEqual(project(process.env.EVOVERSES_ACCOUNT_TEST_REPO), snapshot);
});

test("real account SQL and active move-learning service load the same pack roster in the website", async () => {
  const gameRoot = path.join(process.env.EVOVERSES_ACCOUNT_TEST_REPO || path.resolve(__dirname, "../../../../../evoverses-beta-account-bridge"), "Prototypes/player_economy");
  const fs = require("node:fs"), { randomUUID } = require("node:crypto");
  const { localPGlite, setup } = require(path.join(gameRoot, "scripts/fixtures.cjs"));
  const { embeddedDatabase } = require(path.join(gameRoot, "src/database.cjs"));
  const { accountFixtures } = require(path.join(gameRoot, "scripts/account-fixtures.cjs"));
  const { GameStore } = require(path.join(gameRoot, "src/game-store.cjs"));
  const { EvoCombatState } = require(path.join(gameRoot, "src/evo-combat-state.cjs"));
  const { MoveLearning } = require(path.join(gameRoot, "src/move-learning.cjs"));
  const db = new (localPGlite())();
  try {
    const f = await setup(db);
    for (const name of fs.readdirSync(path.join(gameRoot, "schema")).filter(n => /^\d{3}_.*\.sql$/.test(n) && Number(n.slice(0, 3)) > 2).sort()) await db.exec(fs.readFileSync(path.join(gameRoot, "schema", name), "utf8"));
    const store = new GameStore({ economy: f.economy, mode: "local-test" });
    await store.installCatalogue();
    const fixture = accountFixtures(embeddedDatabase(db), { grantNewPlayer: (tx, playerId) => store.grantStarter(tx, playerId) });
    const web = await fixture.accounts.login({ proof: fixture.proof("learning-epic-player", "fixture-web"), confirmNewPlayer: true });
    const game = await fixture.accounts.login({ proof: fixture.proof("learning-epic-player", "fixture-game") });
    assert.equal(web.player.id, game.player.id);
    const opened = await store.openPack(game.sessionToken, { requestId: randomUUID(), productId: "evo_pack_2", revision: 2 });
    const gameRepo = path.resolve(gameRoot, "../..");
    const combat = new EvoCombatState({ accounts: fixture.accounts, mode: "local-test", definitions: require(path.join(gameRepo, "Content/Store/Data/combat-definitions.json")), progression: require(path.join(gameRepo, "Content/Store/Data/evo-progression.json")) });
    combat.learning = new MoveLearning({ accounts: fixture.accounts, combat, reservations: {} });
    await db.query("UPDATE player.move_learning_control SET mode='active'");
    const reader = createPlayerWebAuth({ configuration: () => ({ apiUrl: "http://127.0.0.1:50999", clientId: "fixture", clientSecret: "synthetic", applicationId: "fixture", deploymentId: "fixture" }),
      // Exercise the real account reader, SQL and projection without requiring
      // a TCP listener in restricted execution environments.
      fetchImpl: async (_url, init) => {
        const token = new Headers(init.headers).get("authorization").slice(7);
        const inventory = await f.economy.getSnapshot(token);
        return Response.json(await combat.project(token, { items: inventory.items, evos: inventory.evos }));
      } });
    const inventory = await reader.readInventory(web.sessionToken), rows = ordinaryInventory(inventory).filter(row => row.kind === "evo");
    assert.deepEqual(rows.map(row => row.id.slice(4)).sort(), opened.evos.map(e => e.id).sort());
    for (const row of rows) {
      assert.equal(row.details.combatVerified, true);
      assert.equal(row.details.level, 1);
      assert.equal(row.details.moves.filter(m => m.unlocked).length, 4);
      assert.deepEqual(row.details.moves.filter(m => m.unlocked).map(m => m.id).sort((a,b)=>a-b), [...policy.species[row.species].starters].sort((a,b)=>a-b));
    }
    assert.equal((await reader.readInventory(f.bobToken)).evos.length, 0);
    const resourceKey = `account:${opened.evos[0].id}`;
    await db.query("UPDATE player.evo_combat_state SET current_health=0 WHERE resource_key=$1", [resourceKey]);
    await db.query("UPDATE player.evo_move_pp SET remaining=0 WHERE resource_key=$1", [resourceKey]);
    const depleted = ordinaryInventory(await reader.readInventory(web.sessionToken)).find(row => row.id === `evo:${opened.evos[0].id}`);
    assert.equal(depleted.details.currentHealth, 0);
    assert.ok(depleted.details.moves.filter(m => m.unlocked).every(m => m.remainingPP === 0));
  } finally { await db.close(); }
});
