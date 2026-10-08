"use strict";
const fs = require("node:fs"),
  path = require("node:path"),
  { spawnSync } = require("node:child_process"),
  ts = require("typescript");
const root = path.resolve(__dirname, ".."),
  out = path.join(root, "node_modules/.inventory-test-lib");
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(
  path.join(out, "package.json"),
  JSON.stringify({ type: "commonjs" }),
);
for (const file of [
  "lib/player/auth-core.ts",
  "lib/player/inventory/evo.ts",
  "lib/player/wallet/handler.ts",
  "lib/player/inventory/model.ts",
  "lib/player/inventory/nfts.ts",
  "lib/player/inventory/handler.ts",
]) {
  const result = ts.transpileModule(
    fs.readFileSync(path.join(root, "src", file), "utf8"),
    {
      fileName: file,
      reportDiagnostics: true,
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    },
  );
  if (
    result.diagnostics?.some((d) => d.category === ts.DiagnosticCategory.Error)
  )
    throw Error("Inventory test source compilation failed");
  const dest = path.join(out, file.replace(/\.ts$/, ".js"));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(
    dest,
    result.outputText
      .replace(
        'require("@/data/inventory-items.json")',
        'require("../../../data/inventory-items.json")',
      )
      .replace(
        'require("@/data/evo-progression.json")',
        'require("../../../data/evo-progression.json")',
      ),
  );
}
fs.mkdirSync(path.join(out, "data"), { recursive: true });
fs.copyFileSync(
  path.join(root, "src/data/inventory-items.json"),
  path.join(out, "data/inventory-items.json"),
);
fs.copyFileSync(
  path.join(root, "src/data/evo-progression.json"),
  path.join(out, "data/evo-progression.json"),
);
const result = spawnSync(
  process.execPath,
  ["--test", path.join(root, "tests/inventory/inventory.test.cjs")],
  {
    stdio: "inherit",
    env: { ...process.env, EVOVERSES_INVENTORY_TEST_LIB: out },
  },
);
process.exitCode = result.status ?? 1;
