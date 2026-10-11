/** Preserve large balances exactly. This display is never a purchase quote. */
export function formatEvoBalance(value: string, roundToWhole = false): string {
  if (!/^[0-9]+(?:\.[0-9]+)?$/.test(value))
    throw new Error("Invalid EVO balance.");
  const [whole, fraction = ""] = value.split(".");
  if (roundToWhole) {
    const rounded = BigInt(whole!) + (fraction[0] && fraction[0] >= "5" ? 1n : 0n);
    return rounded.toLocaleString("en-US");
  }
  const digits = fraction.replace(/0+$/, "");
  const ending = digits.length
    ? "." + digits.slice(0, 4) + (digits.length > 4 ? "…" : "")
    : "";
  return BigInt(whole!).toLocaleString("en-US") + ending;
}
