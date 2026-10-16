// Source release decisions. Nursery additionally requires a live master-admin check and configured contracts.
// Stripe configuration can remain present while creation of new purchases is paused.
export const evorosPurchasesEnabled: boolean = true;
export const breedingTransactionsApproved: boolean = true;
export const betaPurchaseMessage =
  "Evoros purchases are temporarily unavailable. Please try again soon.";
export const breedingApprovalMessage =
  "Breeding transactions are disabled until the contracts are approved.";
export function requireBreedingApproval() {
  if (!breedingTransactionsApproved) throw new Error(breedingApprovalMessage);
}
