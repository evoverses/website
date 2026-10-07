"use strict";
const fs = require("node:fs"),
  path = require("node:path"),
  ts = require("typescript");
function compiledInventory() {
  const root = path.resolve(__dirname, ".."),
    out = path.join(root, "node_modules/.game-inventory-lib");
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(
    path.join(out, "package.json"),
    JSON.stringify({ type: "commonjs" }),
  );
  for (const file of [
    "lib/evo/queries.ts",
    "lib/player/inventory/nfts.ts",
    "lib/player/inventory/sources.ts",
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
      result.diagnostics?.some(
        (d) => d.category === ts.DiagnosticCategory.Error,
      )
    )
      throw Error("Local inventory source compilation failed");
    const dest = path.join(out, file.replace(/\.ts$/, ".js"));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, result.outputText);
  }
  return {
    ...require(path.join(out, "lib/player/inventory/nfts.js")),
    ...require(path.join(out, "lib/player/inventory/sources.js")),
  };
}
function createGameLinkedInventoryReader({ links, load, projection, sources }) {
  if (!load || !projection || !sources) {
    const built = compiledInventory();
    load = built.loadLinkedNfts;
    projection = built.walletProjection;
    sources = () => built.createNftSources();
  }
  return async (token) => {
    const before = projection(await links.projection(token, {}));
    const page = await load(before, 0, sources());
    // Re-authenticate and recheck links after external reads. Unlink/relink during
    // the read must not publish the removed wallet's inventory.
    const after = projection(await links.projection(token, {}));
    if (after.version !== before.version)
      return { entries: [], partial: true, available: false };
    return {
      entries: page.rows.map((row) => ({
        tokenId: row.tokenId,
        speciesKey: row.species,
        form: row.form,
        experience: row.xp !== null && row.xp <= 2147483647 ? row.xp : null,
        walletId: row.walletId,
        walletLabel: row.walletLabel,
      })),
      partial: page.nextPage !== null || page.warnings.length > 0,
      available:
        !page.warnings.includes("DATA_SERVICE_UNAVAILABLE") &&
        !page.warnings.includes("OWNERSHIP_UNAVAILABLE"),
    };
  };
}
module.exports = { compiledInventory, createGameLinkedInventoryReader };
