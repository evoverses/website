// Release gates are reviewed source decisions, never browser/query/env overrides.
// Stripe configuration can remain present while creation of new purchases is paused.
export const evorosPurchasesEnabled: boolean = false;
export const breedingTransactionsApproved: boolean = false;
export const betaPurchaseMessage =
  "Evoros purchases are paused during beta. Approved testers receive 5,000 Evoros.";
export const breedingApprovalMessage =
  "Breeding transactions are disabled until the contracts are approved.";
export function requireBreedingApproval() {
  if (!breedingTransactionsApproved) throw new Error(breedingApprovalMessage);
}
