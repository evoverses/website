import { decodeEventLog, parseAbiItem, type Address, type Hex } from "viem";
export const breedPreparedEvent = parseAbiItem(
  "event BreedPrepared(uint256 indexed requestId, address indexed breeder, uint256 parent1, uint256 parent2, uint256 amount)",
);
export function breedingRequest(
  log: { address: Address; data: Hex; topics: readonly Hex[] },
  bertha: Address,
  owner: string,
) {
  if (log.address.toLowerCase() !== bertha.toLowerCase()) return null;
  try {
    const event = decodeEventLog({
      abi: [breedPreparedEvent],
      data: log.data,
      topics: log.topics as [Hex, ...Hex[]],
    });
    return event.args.breeder.toLowerCase() === owner.toLowerCase()
      ? event.args.requestId
      : null;
  } catch {
    return null;
  }
}
