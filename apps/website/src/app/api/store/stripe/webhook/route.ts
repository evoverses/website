import type Stripe from "stripe";
import { fulfillCardPayment, StorePaymentError } from "@/lib/store/stripe/core";
import { stripeStoreRuntime } from "@/lib/store/stripe/runtime";
export const runtime = "nodejs";
export async function POST(request: Request) {
  let service: ReturnType<typeof stripeStoreRuntime>;
  try {
    service = stripeStoreRuntime();
  } catch {
    return new Response("Payment confirmation is unavailable.", {
      status: 503,
    });
  }
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
      await request.text(),
      signature,
      service.config.webhookSecret,
    );
  } catch {
    return new Response("Invalid Stripe signature.", { status: 400 });
  }
  if (
    ![
      "checkout.session.completed",
      "checkout.session.async_payment_succeeded",
    ].includes(event.type)
  )
    return Response.json({ received: true, status: "ignored" });
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
