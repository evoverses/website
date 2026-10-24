import 'server-only';
import { createPublicClient, http, parseAbiItem } from 'viem';
import { nurseryChain, nurseryHermannAddress } from './network';
import type { Egg } from './contracts';

const client = createPublicClient({ chain: nurseryChain, transport: http() });
const event = parseAbiItem('event EggRecorded(uint256 indexed tokenId,uint256 parent1,uint256 parent2,uint256 species,uint256 generation)');
type Origin = { species: bigint; generation: bigint; blockNumber: bigint; blockHash: string; parent1: bigint; parent2: bigint };
const cache = new Map<string, Origin>();

// Egg species is fixed by breeding randomness. It is emitted at collection, before hatch traits exist.
export async function readEggOrigin(tokenId: bigint, egg: Egg, head: { number: bigint; timestamp: bigint }): Promise<Origin> {
  const key = `${nurseryChain.id}:${nurseryHermannAddress}:${tokenId}:${egg[3]}`;
  const cached = cache.get(key);
  if (cached && cached.blockNumber <= head.number) {
    const block = await client.getBlock({ blockNumber: cached.blockNumber });
    if (block.hash === cached.blockHash && block.timestamp === egg[3] && cached.parent1 === egg[0] && cached.parent2 === egg[1]) return cached;
    cache.delete(key);
  }
  // The public Fuji RPC accepts at most 100 blocks per eth_getLogs request.
  // Older eggs use the timestamp lookup below, whose final range is at most 64 blocks.
  const recent = head.number > 99n ? head.number - 99n : 0n;
  const query = (fromBlock: bigint, toBlock: bigint) => client.getLogs({ address: nurseryHermannAddress, event, args: { tokenId }, fromBlock, toBlock, strict: true });
  let logs = await query(recent, head.number);
  if (!logs.length) {
    // A single-block log lookup also recovers old eggs without unbounded history scans.
    let low = 0n, high = head.number;
    while (low < high) {
      const mid = (low + high) / 2n;
      const block = await client.getBlock({ blockNumber: mid });
      if (block.timestamp < egg[3]) low = mid + 1n; else high = mid;
    }
    const block = await client.getBlock({ blockNumber: low });
    if (block.timestamp !== egg[3]) throw new Error('Egg creation block is unavailable');
    // Multiple blocks can share a timestamp. Search a bounded range around the first match.
    logs = await query(low, head.number < low + 63n ? head.number : low + 63n);
  }
  for (const log of logs) {
    if (log.blockNumber === null || !log.blockHash || log.args.parent1 !== egg[0] || log.args.parent2 !== egg[1]) continue;
    const block = await client.getBlock({ blockNumber: log.blockNumber });
    if (block.hash !== log.blockHash || block.timestamp !== egg[3]) continue;
    const origin = { species: log.args.species, generation: log.args.generation, parent1: log.args.parent1, parent2: log.args.parent2, blockNumber: log.blockNumber, blockHash: log.blockHash };
    if (cache.size >= 256) cache.delete(cache.keys().next().value!);
    cache.set(key, origin); return origin;
  }
  throw new Error('Canonical egg species is unavailable');
}
