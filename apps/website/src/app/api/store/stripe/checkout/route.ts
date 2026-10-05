import { z } from "zod";
import { createCardCheckout, StorePaymentError } from "@/lib/store/stripe/core";
import { stripeStoreRuntime } from "@/lib/store/stripe/runtime";
export const runtime = "nodejs";
const bodySchema = z
  .object({ bundleId: z.string(), requestId: z.string().uuid() })
  .strict();
const respond = (body: object, status: number) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
export async function POST(request: Request) {
  try {
    const service = stripeStoreRuntime();
    if (!service)
      return respond({ error: "Card purchases are not open yet." }, 503);
    if (request.headers.get("origin") !== service.config.origin)
      return respond({ error: "Invalid purchase origin." }, 403);
    if (!request.headers.get("content-type")?.startsWith("application/json"))
      return respond({ error: "Expected JSON." }, 415);
    const player = await service.players.authenticate(request);
    if (!player)
      return respond(
        { error: "Sign in to your linked game account first." },
        401,
      );
    const text = await request.text();
    if (text.length > 4096)
      return respond({ error: "Purchase request too large." }, 413);
    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      return respond({ error: "Invalid purchase request." }, 400);
    }
    const input = bodySchema.safeParse(raw);
    if (!input.success)
      return respond({ error: "Invalid purchase request." }, 400);
    return respond(
      await createCardCheckout(
        { ...input.data, playerId: player.playerId },
        service.config,
        service.gateway,
        service.players,
      ),
      200,
    );
  } catch (error) {
    return respond(
      {
        error:
          error instanceof StorePaymentError
            ? error.message
            : "Card checkout is temporarily unavailable.",
      },
      error instanceof StorePaymentError ? error.status : 503,
    );
  }
}
