// Reserve headroom for RPC/wallet estimate differences. Unused gas is not spent.
export function nurseryGasBudget(estimate: bigint): bigint {
  if (estimate <= 0n) throw new Error("The network could not estimate transaction gas.");
  return (estimate * 125n + 99n) / 100n;
}
