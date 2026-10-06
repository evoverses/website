import { handleStripeWebhook } from "@/lib/store/stripe/webhook-handler";
import { stripeStoreRuntime } from "@/lib/store/stripe/runtime";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    return await handleStripeWebhook(request, stripeStoreRuntime());
  } catch {
    return new Response("Payment confirmation is unavailable.", {
      status: 503,
    });
  }
}
