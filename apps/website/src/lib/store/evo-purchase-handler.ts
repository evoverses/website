import "server-only";
import { z } from "zod";
import { getEpicConfig, getPlayerWebOrigin } from "../player/server";
import { playerSessionCookie } from "../player/auth-core";
import { evorosPurchasesEnabled } from "../beta/release-policy";
const schemas = {
  reserve: z.object({ requestId: z.string().uuid(), bundleId: z.string().max(80), address: z.string().regex(/^0x[a-fA-F0-9]{40}$/) }).strict(),
  verify: z.object({ orderId: z.string().uuid(), transactionHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/) }).strict(),
  find: z.object({ orderId: z.string().uuid() }).strict(),
};
const reply = (value: unknown, status: number) => Response.json(value, { status, headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
export async function evoPurchase(request: Request, operation: keyof typeof schemas) {
  try {
    const origin = getPlayerWebOrigin();
    if (new URL(request.url).origin !== origin || request.headers.get("host") !== new URL(origin).host || (operation !== "find" && request.headers.get("origin") !== origin)) return reply({ error: "Invalid purchase origin." }, 403);
    if (!evorosPurchasesEnabled) return reply({ error: "Purchases are temporarily unavailable." }, 403);
    const config = getEpicConfig();
    if (!config?.hosted) return reply({ error: "EVO checkout is unavailable." }, 503);
    const cookies = (request.headers.get("cookie") ?? "").split(";").map(v => v.trim()).filter(v => v.startsWith(playerSessionCookie + "="));
    const token = cookies.length === 1 ? cookies[0]!.slice(playerSessionCookie.length + 1) : "";
    if (!/^[a-f0-9]{64}$/.test(token)) return reply({ error: "Sign in with Epic before buying Evoros." }, 401);
    let raw: unknown;
    if (operation === "find") raw = { orderId: new URL(request.url).searchParams.get("orderId") };
    else {
      if (!request.headers.get("content-type")?.startsWith("application/json")) return reply({ error: "Expected JSON." }, 415);
      const text = await request.text(); if (text.length > 4096) return reply({ error: "Purchase request is too large." }, 413);
      try { raw = JSON.parse(text); } catch { return reply({ error: "Invalid purchase request." }, 400); }
    }
    const input = schemas[operation].safeParse(raw);
    if (!input.success) return reply({ error: "Invalid purchase request." }, 400);
    const response = await fetch(config.apiUrl + "/internal/store", {
      method: "POST", headers: { "Content-Type": "application/json", "X-EvoVerses-Service": config.hosted.serviceToken },
      body: JSON.stringify({ operation: "evo-" + operation, sessionToken: token, ...input.data }),
      redirect: "manual", cache: "no-store", credentials: "omit", signal: AbortSignal.timeout(30000),
    });
    const text = await response.text(); if (text.length > 16384) throw Error("Invalid response");
    const result = JSON.parse(text);
    if (!response.ok) {
      const code = result?.error?.code;
      const messages: Record<string, string> = { QUOTE_UNAVAILABLE: "The EVO market rate is temporarily unavailable. Refresh the EVO quote and try again; no payment has been sent.", WALLET_LINK_REQUIRED: "Link this wallet to your game account before buying Evoros.", PAYMENT_PENDING: "Your payment is confirming. Check again shortly.", PAYMENT_INVALID: "This transaction does not match the reserved EVO purchase.", RETRY_CONFLICT: "This purchase attempt has different payment details. Please check your existing payment.", CONFLICT: "This payment has already been used.", ORDER_NOT_FOUND: "Purchase not found.", INVALID_SESSION: "Sign in again to check your purchase." };
      return reply({ error: messages[code] ?? "EVO payment verification is temporarily unavailable. Keep your transaction hash and check again.", code }, [400,401,403,404,409,429].includes(response.status) ? response.status : 503);
    }
    if (!result.value || !schemas.find.safeParse({ orderId: result.value.orderId }).success) throw Error("Invalid response");
    return reply(result.value, 200);
  } catch { return reply({ error: "EVO checkout is temporarily unavailable. Keep any payment transaction hash and check again." }, 503); }
}
