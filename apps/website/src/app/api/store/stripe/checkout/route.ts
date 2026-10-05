import { createCheckoutHandler } from "@/lib/store/stripe/checkout-handler";
import { stripeStoreRuntime } from "@/lib/store/stripe/runtime";
export const runtime = "nodejs";
export const POST = createCheckoutHandler(stripeStoreRuntime);
