// Accepted quantities and unchanged art from Design/ItemStore/Currency.
// Test prices and the EVO preview discount live in lib/store/pricing.ts.
export const evorosBundles = [
  {
    id: "bundle_pouch",
    name: "Pocket Pouch",
    amount: 250,
    description: "A little extra for your next shop stop.",
    image: "/store/evoros/bundle_pouch.png",
  },
  {
    id: "bundle_satchel",
    name: "Trail Satchel",
    amount: 500,
    description: "Keep a few more possibilities in your pocket.",
    image: "/store/evoros/bundle_satchel.png",
  },
  {
    id: "bundle_canister",
    name: "Token Canister",
    amount: 1000,
    description: "Stock up for the choices ahead.",
    image: "/store/evoros/bundle_canister.png",
  },
  {
    id: "bundle_case",
    name: "Supply Case",
    amount: 2500,
    description: "More room to plan your next purchases.",
    image: "/store/evoros/bundle_case.png",
  },
  {
    id: "bundle_chest",
    name: "Treasure Chest",
    amount: 5000,
    description: "Open up more possibilities at the store.",
    image: "/store/evoros/bundle_chest.png",
  },
  {
    id: "bundle_vault",
    name: "Grand Vault",
    amount: 10000,
    description: "A generous reserve for future adventures.",
    image: "/store/evoros/bundle_vault.png",
  },
] as const;
export type EvorosBundle = (typeof evorosBundles)[number];
