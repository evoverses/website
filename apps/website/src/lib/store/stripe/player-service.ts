import "server-only";
import { getLocalStoreConnection, playerWebAuth } from "../../player/server";
import { playerSessionCookie } from "../../player/auth-core";
import {
  StorePaymentError,
  type StorePlayerService,
  type StoreOrder,
} from "./core";

/** Local sandbox only. The owning account service alone opens the player database. */
export function getStorePlayerService(): StorePlayerService | null {
  const connection = getLocalStoreConnection();
  if (!connection) return null;
  let verified: { token: string; playerId: string } | null = null;
  async function rpc<T>(
    operation: string,
    body: Record<string, unknown>,
  ): Promise<T> {
    const response = await fetch(connection!.apiUrl + "/internal/store", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + connection!.token,
      },
      body: JSON.stringify({ operation, ...body }),
      cache: "no-store",
      redirect: "error",
      credentials: "omit",
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok)
      throw new StorePaymentError(
        response.status === 401 ? 401 : 503,
        response.status === 401
          ? "Sign in again before buying Evoros."
          : "Payment confirmation is temporarily unavailable.",
      );
    const text = await response.text();
    if (text.length > 16_384)
      throw new StorePaymentError(503, "Unexpected player service response.");
    return (JSON.parse(text) as { value: T }).value;
  }
  return {
    async authenticate(request) {
      verified = null;
      const values = (request.headers.get("cookie") || "")
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.startsWith(playerSessionCookie + "="));
      if (values.length !== 1) return null;
      const token = values[0]!.slice(playerSessionCookie.length + 1);
      if (!/^[a-f0-9]{64}$/.test(token)) return null;
      try {
        const account = await playerWebAuth().readProfile(token);
        verified = { token, playerId: account.player.id };
        return { playerId: account.player.id };
      } catch {
        return null;
      }
    },
    async reserveOrder(input) {
      if (!verified || input.playerId !== verified.playerId)
        throw new StorePaymentError(401, "Sign in before buying Evoros.");
      return rpc<StoreOrder>("reserve", {
        sessionToken: verified.token,
        requestId: input.requestId,
        bundleId: input.bundleId,
      });
    },
    attachStripeSession: async (orderId, sessionId) => {
      await rpc("attach", { orderId, sessionId });
    },
    findOrder: (orderId) => rpc<StoreOrder | null>("find", { orderId }),
    creditOnce: (orderId, sessionId) =>
      rpc<"credited" | "already_credited">("credit", { orderId, sessionId }),
  };
}
