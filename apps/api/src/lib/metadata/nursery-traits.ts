import { createHash } from "node:crypto";

/** Size is already converted by the canonical reader/projection. Do not convert twice. */
export function sizeMetadataTrait(percentage: number) {
  if (!Number.isSafeInteger(percentage) || percentage < -100 || percentage > 100 || percentage % 10 !== 0) throw new Error("Invalid percentage size metadata");
  return { trait_type: "Size", value: percentage, display_type: "boost_percentage" };
}
export function breedingMetadataTraits(metadata: {
  generation: number;
  totalBreeds: number;
  rarity: string;
}) {
  return [
    metadata.generation === 0
      ? { trait_type: "Breeds Remaining", value: "Unlimited" }
      : {
          trait_type: "Breeds Remaining",
          value: Math.max(0, 5 - metadata.totalBreeds),
          max_value: 5,
        },
    ...(metadata.rarity === "epic"
      ? [{ trait_type: "Rarity", value: "Epic" }]
      : []),
  ];
}
/** A changed public trait/XP record gets a fresh image URL, including after rollback. */
export const metadataImageVersion = (metadata: object) =>
  createHash("sha256")
    .update(JSON.stringify(metadata))
    .digest("hex")
    .slice(0, 20);

/** Unknown historic dates are omitted from NFT metadata rather than emitted as epoch zero. */
export function metadataDateSeconds(value: string | null | undefined) {
  if (!value) return null;
  const milliseconds = Date.parse(value);
  return Number.isFinite(milliseconds) && milliseconds >= 1000 ? Math.floor(milliseconds / 1000) : null;
}
