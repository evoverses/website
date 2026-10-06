import type Stripe from "stripe";
import type { StripeStoreConfig } from "./config";
import {
  fulfillCardPayment,
  StorePaymentError,
  type StorePlayerService,
  type StripeGateway,
} from "./core";

export type WebhookService = {
  config: StripeStoreConfig;
  players: StorePlayerService;
  gateway: StripeGateway;
  sdk: {
    webhooks: {
      constructEvent(
        body: string,
        signature: string,
        secret: string,
      ): Stripe.Event;
    };
  };
};
/** Read the untouched raw bytes with a limit before signature verification. */
async function rawBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 1_048_576) {
        await reader.cancel();
        throw new StorePaymentError(413, "Webhook payload is too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks).toString("utf8");
}
export async function handleStripeWebhook(
  request: Request,
  service: WebhookService | null,
) {
  if (!service)
    return new Response("Payment confirmation is not configured.", {
      status: 503,
    });
  const signature = request.headers.get("stripe-signature");
  if (!signature)
    return new Response("Missing Stripe signature.", { status: 400 });
  let event: Stripe.Event;
  try {
    event = service.sdk.webhooks.constructEvent(
      await rawBody(request),
      signature,
      service.config.webhookSecret,
    );
  } catch (error) {
    return new Response(
      error instanceof StorePaymentError
        ? error.message
        : "Invalid Stripe signature.",
      { status: error instanceof StorePaymentError ? error.status : 400 },
    );
  }
  if (event.livemode !== service.config.live)
    return new Response("Unexpected webhook mode.", { status: 400 });
  if (
    ![
      "checkout.session.completed",
      "checkout.session.async_payment_succeeded",
    ].includes(event.type)
  )
    return Response.json({ received: true, status: "ignored" }); // Failed or cancelled payments never credit currency.
  try {
    const status = await fulfillCardPayment(
      (event.data.object as Stripe.Checkout.Session).id,
      service.config,
      service.gateway,
      service.players,
    );
    return Response.json({ received: true, status });
  } catch (error) {
    return new Response(
      error instanceof StorePaymentError
        ? error.message
        : "Payment confirmation will be retried.",
      { status: error instanceof StorePaymentError ? error.status : 503 },
    );
  }
}
