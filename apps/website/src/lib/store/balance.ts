/** Preserve large balances exactly. This display is never a purchase quote. */
export function formatEvoBalance(value: string): string {
  if (!/^[0-9]+(?:\.[0-9]+)?$/.test(value))
    throw new Error("Invalid EVO balance.");
  const [whole, fraction = ""] = value.split(".");
  const digits = fraction.replace(/0+$/, "");
  const ending = digits.length
    ? "." + digits.slice(0, 4) + (digits.length > 4 ? "…" : "")
    : "";
  return BigInt(whole!).toLocaleString("en-US") + ending;
}
