import { stripeStoreRuntime } from "@/lib/store/stripe/runtime";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const respond = (body: object, status: number) =>
    Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
  try {
    const service = stripeStoreRuntime();
    if (!service)
      return respond({ error: "Sandbox checkout is unavailable." }, 503);
    const player = await service.players.authenticate(request);
    if (!player) return respond({ error: "Sign in to see your order." }, 401);
    const orderId = new URL(request.url).searchParams.get("orderId") || "";
    if (!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(orderId))
      return respond({ error: "Invalid order." }, 400);
    const order = await service.players.findOrder(orderId);
    if (!order || order.playerId !== player.playerId)
      return respond({ error: "Order not found." }, 404);
    return respond({ status: order.status, evoros: order.evoros }, 200);
  } catch {
    return respond(
      { error: "Order confirmation is temporarily unavailable." },
      503,
    );
  }
}
