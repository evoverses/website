import type Stripe from "stripe";
import { evorosBundles } from "../../../data/evoros-bundles";
import type { CardPrice, StripeStoreConfig } from "./config";

export class StorePaymentError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export type StoreOrder = CardPrice & {
  id: string;
  playerId: string;
  bundleId: string;
  evoros: number;
  stripeSessionId: string | null;
  expiresAt: number;
  status: "awaiting_payment" | "credited";
};
/** Must be backed by the real authenticated game service and a durable atomic ledger. */
export interface StorePlayerService {
  authenticate(request: Request): Promise<{ playerId: string } | null>;
  reserveOrder(input: {
    playerId: string;
    requestId: string;
    bundleId: string;
    evoros: number;
    price: CardPrice;
  }): Promise<StoreOrder>;
  attachStripeSession(orderId: string, sessionId: string): Promise<void>;
  findOrder(orderId: string): Promise<StoreOrder | null>;
  creditOnce(
    orderId: string,
    sessionId: string,
  ): Promise<"credited" | "already_credited">;
}
export type StripeGateway = {
  retrievePrice(id: string): Promise<Stripe.Price>;
  createSession(
    params: Stripe.Checkout.SessionCreateParams,
    options: { idempotencyKey: string },
  ): Promise<Stripe.Checkout.Session>;
  retrieveSession(id: string): Promise<Stripe.Checkout.Session>;
  listLineItems(
    id: string,
  ): Promise<{ data: Stripe.LineItem[]; has_more: boolean }>;
};
const bundleById = (id: string) => evorosBundles.find((b) => b.id === id);
const safeId = (id: string) => /^[a-zA-Z0-9_-]{1,150}$/.test(id);
function checkoutUrl(session: Stripe.Checkout.Session) {
  if (session.status !== "open" || !session.url)
    throw new StorePaymentError(
      409,
      "This checkout is no longer open. Start a new purchase.",
    );
  const url = new URL(session.url);
  if (
    url.protocol !== "https:" ||
    url.hostname !== "checkout.stripe.com" ||
    url.username ||
    url.password
  )
    throw new StorePaymentError(502, "Invalid Stripe checkout response.");
  return session.url;
}
export async function createCardCheckout(
  input: { playerId: string; bundleId: string; requestId: string },
  config: StripeStoreConfig,
  stripe: StripeGateway,
  players: StorePlayerService,
) {
  const bundle = bundleById(input.bundleId),
    price = config.prices[input.bundleId];
  if (
    !bundle ||
    !price ||
    !safeId(input.playerId) ||
    !/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(input.requestId)
  )
    throw new StorePaymentError(400, "Invalid purchase request.");
  const remote = await stripe.retrievePrice(price.priceId);
  if (
    !remote.active ||
    remote.type !== "one_time" ||
    remote.livemode !== config.live ||
    remote.currency !== price.currency ||
    remote.unit_amount !== price.unitAmount
  )
    throw new StorePaymentError(
      503,
      "The selected bundle price is unavailable.",
    );
  const order = await players.reserveOrder({
    ...input,
    evoros: bundle.amount,
    price,
  });
  if (
    !safeId(order.id) ||
    order.playerId !== input.playerId ||
    order.bundleId !== bundle.id ||
    order.evoros !== bundle.amount ||
    order.priceId !== price.priceId ||
    order.currency !== price.currency ||
    order.unitAmount !== price.unitAmount
  )
    throw new StorePaymentError(
      503,
      "The purchase order could not be verified.",
    );
  if (order.status === "credited")
    throw new StorePaymentError(
      409,
      "This purchase has already been credited.",
    );
  if (order.stripeSessionId)
    return {
      url: checkoutUrl(await stripe.retrieveSession(order.stripeSessionId)),
      orderId: order.id,
    };
  const now = Math.floor(Date.now() / 1000);
  if (
    !Number.isSafeInteger(order.expiresAt) ||
    order.expiresAt < now + 1800 ||
    order.expiresAt > now + 86400
  )
    throw new StorePaymentError(
      409,
      "This checkout creation window has ended. Start a new purchase.",
    );
  const session = await stripe.createSession(
    {
      mode: "payment",
      allowed_payment_method_types: ["card"],
      allow_promotion_codes: false,
      expires_at: order.expiresAt,
      automatic_tax: { enabled: false },
      adaptive_pricing: { enabled: false },
      line_items: [{ price: order.priceId, quantity: 1 }],
      client_reference_id: order.id,
      metadata: {
        flow: "evoros-store-v1",
        orderId: order.id,
        playerId: order.playerId,
        bundleId: order.bundleId,
        evoros: String(order.evoros),
      },
      success_url: config.origin + "/store?checkout=returned",
      cancel_url: config.origin + "/store?checkout=cancelled",
    },
    { idempotencyKey: "evoros-order-" + order.id },
  );
  const url = checkoutUrl(session);
  await players.attachStripeSession(order.id, session.id);
  return { url, orderId: order.id };
}
/** Signature verification happens before this function. The return page never grants currency. */
export async function fulfillCardPayment(
  sessionId: string,
  config: StripeStoreConfig,
  stripe: StripeGateway,
  players: StorePlayerService,
): Promise<"ignored" | "pending" | "credited" | "already_credited"> {
  const session = await stripe.retrieveSession(sessionId);
  if (session.metadata?.flow !== "evoros-store-v1") return "ignored";
  if (session.livemode !== config.live || session.mode !== "payment")
    throw new StorePaymentError(400, "Unexpected checkout mode.");
  if (session.payment_status !== "paid" || session.status !== "complete")
    return "pending";
  const order = session.client_reference_id
    ? await players.findOrder(session.client_reference_id)
    : null;
  if (!order || (order.stripeSessionId && order.stripeSessionId !== session.id))
    throw new StorePaymentError(
      503,
      "The purchase order is not ready for confirmation.",
    );
  const lines = await stripe.listLineItems(session.id);
  const item = lines.data[0];
  if (
    lines.has_more ||
    lines.data.length !== 1 ||
    item?.quantity !== 1 ||
    item.price?.id !== order.priceId ||
    session.currency !== order.currency ||
    session.amount_subtotal !== order.unitAmount ||
    session.amount_total !== order.unitAmount ||
    session.metadata.orderId !== order.id ||
    session.metadata.playerId !== order.playerId ||
    session.metadata.bundleId !== order.bundleId ||
    session.metadata.evoros !== String(order.evoros)
  )
    throw new StorePaymentError(
      400,
      "Payment does not match the reserved bundle.",
    );
  // Recover an interrupted session attachment only after all immutable order fields match.
  // The service must compare-and-set the session, never replace a different bound session.
  await players.attachStripeSession(order.id, session.id);
  // The service must credit the stored order atomically once, including concurrent webhook retries.
  return players.creditOnce(order.id, session.id);
}
