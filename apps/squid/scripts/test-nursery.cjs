const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
const out =
  process.env.NURSERY_TEST_OUT ||
  path.join(root, "node_modules/.nursery-test-lib");
fs.mkdirSync(out, { recursive: true });
function compile(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const source = path.join(dir, entry.name);
    if (entry.isDirectory()) compile(source);
    else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts")) {
      const result = ts.transpileModule(fs.readFileSync(source, "utf8"), {
        fileName: source,
        reportDiagnostics: true,
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2020,
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
        },
      });
      if (
        result.diagnostics?.some(
          (d) => d.category === ts.DiagnosticCategory.Error,
        )
      )
        throw new Error(
          ts.formatDiagnosticsWithColorAndContext(
            result.diagnostics,
            ts.createCompilerHost({}),
          ),
        );
      const dest = path.join(
        out,
        path.relative(path.join(root, "src"), source).replace(/\.ts$/, ".js"),
      );
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, result.outputText);
    }
  }
}
compile(path.join(root, "src"));
const guard = ts.transpileModule(
  fs.readFileSync(
    path.join(root, "../lambda/src/legacy-breeding-policy.ts"),
    "utf8",
  ),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  },
);
fs.writeFileSync(path.join(out, "legacy-breeding-policy.js"), guard.outputText);
const apiTraits = ts.transpileModule(
  fs.readFileSync(
    path.join(root, "../api/src/lib/metadata/nursery-traits.ts"),
    "utf8",
  ),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  },
);
fs.writeFileSync(path.join(out, "api-nursery-traits.js"), apiTraits.outputText);
const sourceTests = path.join(root, "tests/nursery");
const testDir = path.join(out, "tests");
fs.mkdirSync(testDir, { recursive: true });
for (const name of fs.readdirSync(sourceTests))
  fs.copyFileSync(path.join(sourceTests, name), path.join(testDir, name));
const tests = fs
  .readdirSync(testDir)
  .filter((name) => name.endsWith(".test.cjs"))
  .map((name) => path.join(testDir, name));
const result = spawnSync(process.execPath, ["--test", ...tests], {
  stdio: "inherit",
  cwd: root,
  env: { ...process.env, NURSERY_TEST_LIB: out, NURSERY_TEST_SOURCE_DIR: root },
});
process.exitCode = result.status ?? 1;
