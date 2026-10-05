import { evorosBundles } from "../../../data/evoros-bundles";
import { cashCents } from "../pricing";
export type CardPrice = {
  priceId: string;
  currency: string;
  unitAmount: number;
};
export type StripeStoreConfig = {
  secretKey: string;
  webhookSecret: string;
  origin: string;
  live: boolean;
  prices: Record<string, CardPrice>;
};
export function stripeStoreConfig(
  env: Record<string, string | undefined>,
): StripeStoreConfig | null {
  if (env.EVOROS_STRIPE_ENABLED !== "true") return null;
  const live = env.EVOROS_STRIPE_MODE === "live";
  if (!["test", "live"].includes(env.EVOROS_STRIPE_MODE ?? "test"))
    throw new Error("Invalid Stripe mode.");
  if (
    !new RegExp(
      "^(?:rk|sk)_" + (live ? "live" : "test") + "_[a-zA-Z0-9]+$",
    ).test(env.STRIPE_SECRET_KEY ?? "") ||
    !env.STRIPE_WEBHOOK_SECRET?.startsWith("whsec_")
  )
    throw new Error(
      "Stripe credentials are missing or do not match the selected mode.",
    );
  const url = new URL(env.EVOROS_STORE_ORIGIN ?? "");
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/" ||
    !(
      url.protocol === "https:" ||
      (!live &&
        url.protocol === "http:" &&
        ["localhost", "127.0.0.1"].includes(url.hostname))
    )
  )
    throw new Error("Invalid store return origin.");
  const raw: unknown = JSON.parse(env.EVOROS_STRIPE_PRICES ?? "{}");
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    throw new Error("Missing approved Stripe prices.");
  const prices: Record<string, CardPrice> = {};
  const ids = new Set(evorosBundles.map((b) => b.id));
  if (
    Object.keys(raw).some(
      (id) => !ids.has(id as (typeof evorosBundles)[number]["id"]),
    )
  )
    throw new Error("Unknown Stripe bundle.");
  for (const bundle of evorosBundles) {
    const item = (raw as Record<string, Record<string, unknown>>)[bundle.id];
    if (
      !item ||
      typeof item.priceId !== "string" ||
      !/^price_[a-zA-Z0-9]+$/.test(item.priceId) ||
      typeof item.currency !== "string" ||
      !/^[a-z]{3}$/.test(item.currency) ||
      !Number.isSafeInteger(item.unitAmount) ||
      Number(item.unitAmount) <= 0
    )
      throw new Error("Each bundle requires an approved fixed Stripe price.");
    if (
      !live &&
      (item.currency !== "usd" || item.unitAmount !== cashCents(bundle.amount))
    )
      throw new Error("Test prices must match US$0.01 per Evoro.");
    prices[bundle.id] = {
      priceId: item.priceId,
      currency: item.currency,
      unitAmount: Number(item.unitAmount),
    };
  }
  if (
    new Set(Object.values(prices).map((p) => p.priceId)).size !==
    evorosBundles.length
  )
    throw new Error("Stripe bundle prices must be distinct.");
  return {
    secretKey: env.STRIPE_SECRET_KEY!,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
    origin: url.origin,
    live,
    prices,
  };
}
