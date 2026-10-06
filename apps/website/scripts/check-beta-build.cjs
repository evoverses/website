// Set isolation flags inside native Node, including when launched through WSL.
const { spawnSync } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const cwd = path.resolve(__dirname, "..");
const configPath = path.join(cwd, "tsconfig.json");
const original = fs.readFileSync(configPath, "utf8");
const result = spawnSync(process.execPath, [path.join(cwd, "node_modules/next/dist/bin/next"), "build"], {
  cwd, stdio: "inherit",
  env: { ...process.env, EVOVERSES_LOCAL_BUILD_CHECK: "1", NEXT_TELEMETRY_DISABLED: "1" },
});
// Next adds its temporary output directory to include. Restore only if no
// other configuration changed, so concurrent edits are never overwritten.
try {
  const before = JSON.parse(original), after = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const extra = ".next-beta-check/types/**/*.ts";
  if (!before.include?.includes(extra)) {
    after.include = after.include.filter(value => value !== extra);
    const comparable = value => JSON.stringify({ ...value, include: [...value.include].sort() });
    if (comparable(before) === comparable(after)) fs.writeFileSync(configPath, original);
    else console.warn("tsconfig.json also changed independently; preserved it for review.");
  }
} catch {
  console.warn("Could not compare tsconfig.json; preserved it for review.");
}
if (result.error) console.error(result.error.message);
process.exitCode = result.status ?? 1;
