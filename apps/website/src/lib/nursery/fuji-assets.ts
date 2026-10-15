import 'server-only';
import { readEggOrigin } from './egg-origin';
import { createPublicClient, http, erc721Abi, type Abi, type Address, type Hex } from 'viem';
import { nurseryChain, nurseryNftAddress, nurseryHermannAddress, nurseryNetworkConfigured, nurseryRegistryVersion, nurseryHermannHistory } from './network';
import hermannAbi from './abi/Hatcher_Hermann.json';
import type { Adult, Egg } from './contracts';
import type { SquidAsset, SquidAssetEvoMetadata } from '@workspace/evoverses/lib/asset/types';
import { species, elements, natures } from '@workspace/database/types/evo';
import { AccessError } from '@/lib/downloads/server';

const client = createPublicClient({ chain: nurseryChain, transport: http() });
const enumerable = [...erc721Abi, { type: 'function', name: 'tokenOfOwnerByIndex', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }, { name: 'index', type: 'uint256' }], outputs: [{ type: 'uint256' }] }] as const;
function number(value: bigint, max = Number.MAX_SAFE_INTEGER) {
  if (value < 0n || value > BigInt(max)) throw new Error('Invalid canonical test asset'); return Number(value);
}
export async function fujiAssets(owner: Address, page: number) {
  if (!nurseryNetworkConfigured) throw new AccessError(409, 'NURSERY_NOT_CONFIGURED');
  const block = await client.getBlock(), blockNumber = block.number;
  const total = number(await client.readContract({ address: nurseryNftAddress, abi: enumerable, functionName: 'balanceOf', args: [owner], blockNumber }));
  const indices = Array.from({ length: Math.max(0, Math.min(48, total - page * 48)) }, (_, i) => BigInt(page * 48 + i));
  const ids = await client.multicall({ blockNumber, allowFailure: false, contracts: indices.map(index => ({ address: nurseryNftAddress, abi: enumerable, functionName: 'tokenOfOwnerByIndex', args: [owner, index] })) });
  const known = await client.multicall({ blockNumber, allowFailure: false, contracts: ids.map(id => ({ address: nurseryHermannAddress, abi: hermannAbi as Abi, functionName: 'known', args: [id] })) });
  const items = await Promise.all(ids.filter((_, index) => known[index] === true).map(id => {
    if (typeof id !== "bigint") throw new Error("Invalid test token ID");
    return canonicalAsset(owner, id, block);
  }));
  return { items, nextPage: (page + 1) * 48 < total ? page + 1 : null, total };
}
export async function fujiAsset(owner: Address, tokenId: bigint) {
  if (!nurseryNetworkConfigured) throw new AccessError(409, 'NURSERY_NOT_CONFIGURED');
  const block = await client.getBlock();
  const asset = await canonicalAsset(owner, tokenId, block);
  return { asset, blockNumber: block.number.toString(), blockHash: block.hash };
}
async function canonicalAsset(owner: Address, id: bigint, block: { number: bigint; timestamp: bigint; hash: Hex }) {
    const blockNumber = block.number;
    if (typeof id !== "bigint") throw new Error("Invalid test token ID");
    const currentOwner = await client.readContract({ address: nurseryNftAddress, abi: enumerable, functionName: 'ownerOf', args: [id], blockNumber });
    if (currentOwner.toLowerCase() !== owner.toLowerCase()) throw new AccessError(409, 'NFT_OWNER_CHANGED');
    const egg = await client.readContract({ address: nurseryHermannAddress, abi: hermannAbi as Abi, functionName: 'eggs', args: [id], blockNumber }) as Egg;
    const updatedAt = new Date(number(block.timestamp) * 1000).toISOString();
    const base = { tokenId: id.toString(), chainId: String(nurseryChain.id), address: nurseryNftAddress, owner, offers: [], listings: [], auctions: [] };
    const kind = nurseryRegistryVersion === 2 ? number(await client.readContract({ address: nurseryHermannAddress, abi: hermannAbi as Abi, functionName: 'eggKind', args: [id], blockNumber }) as bigint, 2) : egg[5] > 0 ? 2 : 0;
    if ([1, 2].includes(egg[5]) && kind === 1) {
      return { ...base, metadata: { type: 'EGG', eggKind: 'genesis', species: 'Unknown', generation: 0, treated: egg[4], createdAt: egg[3] === 0n ? null : new Date(number(egg[3]) * 1000).toISOString(), updatedAt } } satisfies SquidAsset;
    }
    // Species-specific egg art uses the canonical EggRecorded event, never placeholder metadata.
    if ([1, 2].includes(egg[5])) {
      const parents = await Promise.all([egg[0], egg[1]].map(tokenId => client.readContract({ address: nurseryHermannAddress, abi: hermannAbi as Abi, functionName: 'adultOf', args: [tokenId], blockNumber }) as Promise<Adult>));
      const generation = Math.max(...parents.map(parent => number(parent.generation, 255))) + 1;
      const origin = await readEggOrigin(id, egg, block);
      if (origin.generation !== BigInt(generation)) throw new Error('Egg generation mismatch');
      const pool = await client.readContract({ address: nurseryHermannAddress, abi: hermannAbi as Abi, functionName: 'getSpeciesPool', args: [egg[2]], blockNumber }) as readonly { id: bigint; primaryType: bigint; secondaryType: bigint }[];
      const traits = pool.find(item => item.id === origin.species);
      if (!traits) throw new Error('Egg species configuration is unavailable');
      return { ...base, metadata: { type: 'EGG', eggKind: 'bred', species: species[number(origin.species, species.length - 1)]!, parent1Id: egg[0].toString(), parent2Id: egg[1].toString(), primaryType: elements[number(traits.primaryType, elements.length - 1)]!, secondaryType: elements[number(traits.secondaryType, elements.length - 1)]!, generation, treated: egg[4], createdAt: new Date(number(egg[3]) * 1000).toISOString(), updatedAt } } satisfies SquidAsset;
    }
    const adult = await client.readContract({ address: nurseryHermannAddress, abi: hermannAbi as Abi, functionName: 'adultOf', args: [id], blockNumber }) as Adult;
    const a = adult.attributes, s = adult.stats;
    let historyEgg = egg, historyKind = kind;
    let completedAt = nurseryRegistryVersion === 2 && egg[5] === 3
      ? await client.readContract({ address: nurseryHermannAddress, abi: hermannAbi as Abi, functionName: 'hatchCompletedAt', args: [id], blockNumber }) as bigint
      : 0n;
    if (egg[5] === 0) {
      for (const address of nurseryHermannHistory ?? []) {
        if (!await client.readContract({ address, abi: hermannAbi as Abi, functionName: 'known', args: [id], blockNumber })) continue;
        const prior = await client.readContract({ address, abi: hermannAbi as Abi, functionName: 'eggs', args: [id], blockNumber }) as Egg;
        if (prior[5] !== 3) continue;
        const original = await client.readContract({ address, abi: hermannAbi as Abi, functionName: 'adultOf', args: [id], blockNumber }) as Adult;
        // History supplies dates/parents only. Current traits and breeding counters stay authoritative.
        if (original.species !== adult.species || original.generation !== adult.generation ||
          Object.entries(original.attributes).some(([key, value]) => adult.attributes[key as keyof Adult['attributes']] !== value) ||
          Object.entries(original.stats).some(([key, value]) => adult.stats[key as keyof Adult['stats']] !== value)) throw new Error('Preserved Evo history disagrees with current traits');
        const details = await client.multicall({ blockNumber, allowFailure: true, contracts: ['eggKind', 'hatchCompletedAt'].map(functionName => ({ address, abi: hermannAbi as Abi, functionName, args: [id] })) });
        historyEgg = prior;
        historyKind = details[0]?.status === 'success' ? number(BigInt(details[0].result as bigint | number), 2) : 2;
        completedAt = details[1]?.status === 'success' ? details[1].result as bigint : 0n;
        break;
      }
    }
    const hatchDate = completedAt > 0n ? new Date(number(completedAt) * 1000).toISOString() : updatedAt;
    const metadata: SquidAssetEvoMetadata = {
      type: 'EVO', species: species[number(adult.species, species.length - 1)]!, generation: number(adult.generation, 255),
      gender: number(a.gender, 1) ? 'male' : 'female', rarity: number(a.rarity, 2) === 2 ? 'epic' : 'unknown', chroma: a.rarity === 1n ? 'chroma' : 'none',
      primaryType: elements[number(a.primaryType, elements.length - 1)]!, secondaryType: elements[number(a.secondaryType, elements.length - 1)]!,
      nature: natures[number(a.nature, natures.length - 2) + 1]!, size: number(a.size, 20), totalBreeds: number(adult.totalBreeds),
      lastBreedTime: new Date(number(adult.lastBreedTime) * 1000).toISOString(), createdAt: historyKind === 1 ? (historyEgg[3] === 0n ? null : new Date(number(historyEgg[3]) * 1000).toISOString()) : historyEgg[3] > 0n ? new Date(number(historyEgg[3]) * 1000).toISOString() : updatedAt, updatedAt, hatchedAt: hatchDate,
      parent1Id: historyEgg[0] === 0n ? null : historyEgg[0].toString(), parent2Id: historyEgg[1] === 0n ? null : historyEgg[1].toString(),
      xp: 0, attack: number(s.attack, 50), defense: number(s.defense, 50), special: number(s.special, 50), resistance: number(s.resistance, 50), speed: number(s.speed, 50),
    };
    return { ...base, metadata } satisfies SquidAsset;

}
