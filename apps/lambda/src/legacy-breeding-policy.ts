/** The retired worker must never invent token IDs/offspring for Bertha/Hermann. */
export function assertLegacyBreedingAllowed(
  env: Record<string, string | undefined>,
) {
  if (env.NURSERY_HERMANN_ADDRESS || env.BREEDING_BACKEND !== "legacy-brenda")
    throw new Error(
      "Off-chain Brenda breeding is disabled. Bertha/Hermann metadata comes from confirmed contract state.",
    );
}
