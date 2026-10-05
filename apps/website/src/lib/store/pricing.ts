// User-approved test pricing only; production economics need separate approval.
export const EVOROS_TEST_USD_CENTS = 1;
export const EVO_TEST_DISCOUNT_PERCENT = 90;
export const EVO_QUOTE_MAX_AGE_MS = 5 * 60_000;
const TOKEN_UNIT = 10n ** 18n;
export function cashCents(evoros: number): number {
  if (!Number.isSafeInteger(evoros) || evoros <= 0)
    throw new Error("Invalid Evoros quantity.");
  return evoros * EVOROS_TEST_USD_CENTS;
}
export function usd(cents: number): string {
  return "US$" + (cents / 100).toFixed(2);
}
export function positiveDecimal(value: string) {
  if (!/^\d{1,12}(?:\.\d{1,24})?$/.test(value))
    throw new Error("Invalid market price.");
  const [whole, fraction = ""] = value.split(".");
  const digits = BigInt(whole! + fraction);
  if (digits <= 0n) throw new Error("Invalid market price.");
  return { digits, scale: 10n ** BigInt(fraction.length) };
}
export function discountedEvoUnits(evoros: number, priceUsd: string): bigint {
  const { digits, scale } = positiveDecimal(priceUsd);
  // Cash cents / 100 dollars, then pay 10% of that dollar value in EVO.
  const numerator = BigInt(cashCents(evoros)) * TOKEN_UNIT * scale;
  const denominator = 1000n * digits;
  return (numerator + denominator - 1n) / denominator;
}
export function formatEvoEstimate(units: bigint): string {
  if (units <= 0n) throw new Error("Invalid EVO quote.");
  if (units >= 100n * TOKEN_UNIT) {
    return ((units + TOKEN_UNIT / 2n) / TOKEN_UNIT).toLocaleString("en-US");
  }
  const tenth = TOKEN_UNIT / 10n;
  const rounded = (units + tenth / 2n) / tenth;
  // A positive estimate must not look free after display rounding.
  const displayed = rounded > 0n ? rounded : 1n;
  if (displayed >= 1000n) return (displayed / 10n).toLocaleString("en-US");
  return (
    (displayed / 10n).toLocaleString("en-US") +
    "." +
    (displayed % 10n).toString()
  );
}
export function quoteIsFresh(fetchedAt: string, now = Date.now()): boolean {
  const time = Date.parse(fetchedAt);
  return (
    Number.isFinite(time) &&
    time <= now + 5000 &&
    now - time < EVO_QUOTE_MAX_AGE_MS
  );
}
