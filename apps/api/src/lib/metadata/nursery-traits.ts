import { createHash } from "node:crypto";
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
