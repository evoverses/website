const { it } = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const f = require("./fixtures.cjs");
it("the configuration plan prints public settings without connecting to a database or chain", () => {
  const env = {
    ...process.env,
    CHAIN_ID: "43114",
    NFT_ADDRESSES: f.collection,
    NURSERY_HERMANN_ADDRESS: f.hatcher,
    NURSERY_EVO_ADDRESS: f.collection,
    NURSERY_FROM_BLOCK: "10",
  };
  delete env.BREEDING_BACKEND;
  const run = spawnSync(
    process.execPath,
    [path.join(f.lib, "nursery/plan.js")],
    { env, encoding: "utf8" },
  );
  assert.equal(run.status, 0, run.stderr);
  const plan = JSON.parse(run.stdout);
  assert.equal(plan.enabled, true);
  assert.equal(plan.registry.hatcher, f.hatcher);
  assert.equal(plan.writesPerformed, false);
  assert.equal(plan.prerequisites.length, 7);
});
