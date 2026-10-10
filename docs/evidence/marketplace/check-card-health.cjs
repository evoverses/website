const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const root = path.resolve(__dirname, "../../..");
const ts = require(path.join(root, "node_modules/typescript"));
const source = fs.readFileSync(path.join(root, "packages/evoverses/src/lib/asset/health.ts"), "utf8");
const context = { exports: {} };
vm.runInNewContext(ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText, context);
const {currentLevelHealth,levelHealth} = context.exports;
const catalogue = JSON.parse(fs.readFileSync(path.join(root,"apps/website/src/data/evo-progression.json"),"utf8"));
let checks = 0;
for (const [species, entry] of Object.entries(catalogue.species)) {
  for (let level = 1; level <= 100; level++) {
    const xp = level === 1 ? 0 : Math.round(level ** 3 * entry.maxXp / 1000000);
    const start = Math.max(1,Math.round(entry.baseStats.health/10));
    const expected = Math.round((start*(100-level)+entry.baseStats.health*(level-1))/99);
    assert.equal(currentLevelHealth(species,xp),expected,`${species} L${level}`);
    assert.equal(levelHealth(entry.baseStats.health,level),expected);
    if (level > 1) {
      const previous = Math.round((start*(101-level)+entry.baseStats.health*(level-2))/99);
      assert.equal(currentLevelHealth(species,xp-1),previous,`${species} before L${level}`);
    }
    checks++;
  }
}
assert.equal(currentLevelHealth("unknown",0),undefined);
assert.equal(currentLevelHealth("kitsul",-1),undefined);
assert.equal(currentLevelHealth("kitsul",NaN),undefined);
for (const renderer of ["evo-card.tsx","evo-card-image-response.tsx"]) {
  const text=fs.readFileSync(path.join(root,"packages/evoverses/src/components",renderer),"utf8");
  assert.match(text,/StatNameAbbreviation.hp, value: currentLevelHealth/);
  assert.doesNotMatch(text,/StatNameAbbreviation.hp, value: 50/);
}
console.log(JSON.stringify({species:Object.keys(catalogue.species).length,levels:checks,result:"passed"}));
