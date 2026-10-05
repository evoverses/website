import { it } from "node:test";
import assert from "node:assert/strict";
import { discoverOwnedEggs, type EggDiscoveryReader } from "../../src/lib/nursery/discovery.ts";

const owner = "0x1111111111111111111111111111111111111111";

function fixture(count: bigint, status: (id: bigint) => number = () => 0) {
  const batches: bigint[][] = [];
  const block = 987654n;
  const reader: EggDiscoveryReader = {
    blockNumber: async () => block,
    balance: async (wallet, at) => { assert.equal(wallet, owner); assert.equal(at, block); return count; },
    tokenIds: async (wallet, indices, at) => {
      assert.equal(wallet, owner); assert.equal(at, block);
      batches.push([...indices]);
      // Token IDs need not be contiguous or fit in a JavaScript number.
      return indices.map(i => 9007199254740993n + i * 7n);
    },
    eggStatuses: async (ids, at) => { assert.equal(at, block); return ids.map(status); },
  };
  return { reader, batches };
}

it("discovers new owned eggs without indexed records or remembered IDs, across every page", async () => {
  const first = 9007199254740993n;
  const { reader, batches } = fixture(101n, id =>
    id === first ? 1 : id === first + 98n * 7n ? 2 : id === first + 7n ? 3 : 0);
  assert.deepEqual(await discoverOwnedEggs(owner, reader), [first.toString(), (first + 98n * 7n).toString()]);
  assert.deepEqual(batches.map(b => b.length), [48, 48, 5]);
});

it("returns no eggs for an empty wallet without enumeration", async () => {
  const { reader, batches } = fixture(0n);
  assert.deepEqual(await discoverOwnedEggs(owner, reader), []);
  assert.equal(batches.length, 0);
});

it("does not present an RPC failure as an empty or complete wallet", async () => {
  const { reader } = fixture(1n);
  reader.eggStatuses = async () => { throw new Error("RPC unavailable"); };
  await assert.rejects(discoverOwnedEggs(owner, reader), /RPC unavailable/);
});

it("rejects incomplete or duplicate enumeration rather than silently losing eggs", async () => {
  const { reader } = fixture(2n);
  reader.tokenIds = async () => [5n];
  await assert.rejects(discoverOwnedEggs(owner, reader), /all owned/);
  reader.tokenIds = async () => [5n, 5n];
  await assert.rejects(discoverOwnedEggs(owner, reader), /verified/);
});

it("rejects malformed registry responses", async () => {
  const { reader } = fixture(1n);
  reader.eggStatuses = async () => [4];
  await assert.rejects(discoverOwnedEggs(owner, reader), /current state/);
  reader.eggStatuses = async () => [];
  await assert.rejects(discoverOwnedEggs(owner, reader), /current state/);
});

it("stops a retired wallet query before subsequent RPC work", async () => {
  const controller = new AbortController();
  const { reader, batches } = fixture(1n);
  reader.balance = async () => { controller.abort(); return 1n; };
  await assert.rejects(discoverOwnedEggs(owner, reader, controller.signal), { name: "AbortError" });
  assert.equal(batches.length, 0);
});

it("rejects malformed wallet and balance inputs", async () => {
  const { reader } = fixture(-1n);
  await assert.rejects(discoverOwnedEggs("arbitrary-player-id", reader), /wallet address/);
  await assert.rejects(discoverOwnedEggs(owner, reader), /NFT balance/);
});
