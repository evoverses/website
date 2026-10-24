import { it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

type Range = { fromBlock: bigint; toBlock: bigint };
function fixture(originBlock: bigint, groupedTimestamps = false) {
  const head = 10_000n;
  const timestamp = (block: bigint) => groupedTimestamps ? block / 3n * 2n : block * 2n;
  const ranges: Range[] = [];
  const state = { hash: "0xoriginal", wrongParents: false, noLogs: false };
  const log = () => ({ blockNumber: originBlock, blockHash: state.hash, args: {
    species: 12n, generation: 2n, parent1: state.wrongParents ? 999n : 10n, parent2: 20n,
  } });
  const client = {
    getBlock: async ({blockNumber}: {blockNumber: bigint}) => ({hash: blockNumber === originBlock ? state.hash : "0xother", timestamp: timestamp(blockNumber)}),
    getLogs: async (range: Range) => {
      ranges.push(range);
      assert.ok(range.toBlock - range.fromBlock + 1n <= 100n, "public Fuji RPC rejects ranges over 100 blocks");
      assert.ok(range.fromBlock >= 0n);
      return !state.noLogs && range.fromBlock <= originBlock && range.toBlock >= originBlock ? [log()] : [];
    },
  };
  const result = {exports: {} as {readEggOrigin: (id: bigint, egg: unknown[], head: {number: bigint; timestamp: bigint}) => Promise<{species: bigint; generation: bigint; blockHash: string}>}};
  const require = (id: string) => {
    if (id === "server-only") return {};
    if (id === "viem") return {createPublicClient: () => client, http: () => ({}), parseAbiItem: () => ({})};
    if (id === "./network") return {nurseryChain: {id: 43113}, nurseryHermannAddress: "0xregistry"};
    throw new Error("Unexpected import " + id);
  };
  const code = ts.transpileModule(fs.readFileSync("src/lib/nursery/egg-origin.ts", "utf8"), {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020}}).outputText;
  vm.runInNewContext(code, {require, module: result, exports: result.exports});
  const read = () => result.exports.readEggOrigin(5112n, [10n,20n,0n,timestamp(originBlock)], {number:head,timestamp:timestamp(head)});
  return {read,ranges,state};
}

it("finds a recent egg without exceeding the provider's 100-block limit", async () => {
  const f=fixture(9_950n), result=await f.read();
  assert.equal(result.species,12n);
  assert.equal(result.generation,2n);
  assert.equal(f.ranges.length,1);
  assert.equal(f.ranges[0].toBlock-f.ranges[0].fromBlock+1n,100n);
});
it("recovers an older egg using its creation timestamp and a bounded log range", async () => {
  const f=fixture(4_000n);
  assert.equal((await f.read()).species,12n);
  assert.equal(f.ranges.length,2);
  assert.ok(f.ranges[1].toBlock-f.ranges[1].fromBlock+1n<=64n);
});
it("finds the correct egg when multiple blocks share its creation timestamp", async () => {
  const f=fixture(4_001n,true);
  assert.equal((await f.read()).species,12n);
});
it("reuses only a cache entry whose creation block is still canonical", async () => {
  const f=fixture(9_950n);
  await f.read();await f.read();assert.equal(f.ranges.length,1);
  f.state.hash="0xreplacement";
  assert.equal((await f.read()).blockHash,"0xreplacement");
  assert.equal(f.ranges.length,2);
});
it("missing or mismatched origin events remain errors", async () => {
  for(const change of ["noLogs","wrongParents"] as const) {
    const f=fixture(9_950n);f.state[change]=true;
    await assert.rejects(f.read(),/Canonical egg species is unavailable/);
  }
});
