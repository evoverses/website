const fs = require("node:fs"),
  path = require("node:path"),
  { spawnSync } = require("node:child_process"),
  ts = require("typescript");
const root = path.resolve(__dirname, ".."),
  out = path.join(root, "node_modules/.evoros-test-lib");
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(
  path.join(out, "package.json"),
  JSON.stringify({ type: "commonjs" }),
);
for (const file of [
  "data/evoros-bundles.ts",
  "lib/store/stripe/config.ts",
  "lib/store/stripe/core.ts",
]) {
  const source = path.join(root, "src", file),
    dest = path.join(out, file.replace(/\.ts$/, ".js"));
  const result = ts.transpileModule(fs.readFileSync(source, "utf8"), {
    fileName: source,
    reportDiagnostics: true,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  if (
    result.diagnostics?.some((d) => d.category === ts.DiagnosticCategory.Error)
  )
    throw new Error("Cannot compile store fixture source.");
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, result.outputText);
}
const result = spawnSync(
  process.execPath,
  ["--test", path.join(root, "tests/store/stripe.test.cjs")],
  { stdio: "inherit", env: { ...process.env, EVOROS_TEST_LIB: out } },
);
process.exitCode = result.status ?? 1;
