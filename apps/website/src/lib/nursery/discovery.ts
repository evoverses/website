/** Read-only discovery independent of indexed assets or browser storage. */
export type EggDiscoveryReader = {
  blockNumber(): Promise<bigint>;
  balance(owner: string, block: bigint): Promise<bigint>;
  tokenIds(owner: string, indices: readonly bigint[], block: bigint): Promise<readonly bigint[]>;
  eggStatuses(ids: readonly bigint[], block: bigint): Promise<readonly number[]>;
};

export async function discoverOwnedEggs(
  owner: string,
  reader: EggDiscoveryReader,
  signal?: AbortSignal,
): Promise<string[]> {
  if (!/^0x[0-9a-f]{40}$/i.test(owner)) throw new Error("Invalid wallet address.");
  const check = () => signal?.throwIfAborted();
  check();
  const block = await reader.blockNumber();
  check();
  const balance = await reader.balance(owner, block);
  check();
  if (typeof balance !== "bigint" || balance < 0n)
    throw new Error("Could not read your wallet's NFT balance.");

  const eggs: string[] = [];
  const seen = new Set<string>();
  // Keep each RPC batch bounded; do not silently truncate a large wallet.
  for (let start = 0n; start < balance; start += 48n) {
    const length = Number(balance - start > 48n ? 48n : balance - start);
    const indices = Array.from({ length }, (_, i) => start + BigInt(i));
    const ids = await reader.tokenIds(owner, indices, block);
    check();
    if (ids.length !== length)
      throw new Error("Could not load all owned NFT token numbers.");
    for (const id of ids) {
      if (typeof id !== "bigint" || id < 0n || seen.has(id.toString()))
        throw new Error("The owned NFT list could not be verified.");
      seen.add(id.toString());
    }
    const statuses = await reader.eggStatuses(ids, block);
    check();
    if (statuses.length !== ids.length || statuses.some(s => !Number.isInteger(s) || s < 0 || s > 3))
      throw new Error("Could not read the eggs' current state.");
    for (let i = 0; i < ids.length; i++) {
      if (statuses[i] === 1 || statuses[i] === 2) eggs.push(ids[i]!.toString());
    }
  }
  return eggs;
}
