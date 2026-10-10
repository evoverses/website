import { playerSessionCookie, playerWebOrigin } from "../auth-core";
import type { WalletLinkChallenge, WalletLinkStatus } from "./types";

export class WalletWebError extends Error {
  constructor(
    public code: string,
    public status = 503,
  ) {
    super(code);
  }
}
const errors: Record<string, number> = {
  INVALID_SESSION: 401,
  ACCOUNT_UNAVAILABLE: 403,
  INVALID_REQUEST: 400,
  INVALID_SIGNATURE: 400,
  CHALLENGE_EXPIRED: 409,
  WALLET_ALREADY_LINKED: 409,
  LINK_CHANGED: 409,
  WALLET_LIMIT_REACHED: 409,
  RATE_LIMITED: 429,
  SERVICE_UNAVAILABLE: 503,
};
const fields: Record<string, string[]> = {
  status: ["connectedAddress"],
  challenge: ["address"],
  verify: ["challengeId", "signature"],
  unlink: ["linkId", "confirm"],
};
const uuid = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
export function walletReply(
  value: unknown,
  operation: string,
): WalletLinkStatus | WalletLinkChallenge {
  if (!record(value)) throw new WalletWebError("SERVICE_UNAVAILABLE");
  if (operation === "challenge") {
    if (
      typeof value.challengeId !== "string" ||
      !uuid.test(value.challengeId) ||
      typeof value.message !== "string" ||
      value.message.length > 2048 ||
      typeof value.expiresAt !== "string" ||
      !Number.isFinite(Date.parse(value.expiresAt))
    )
      throw new WalletWebError("SERVICE_UNAVAILABLE");
    return {
      challengeId: value.challengeId,
      message: value.message,
      expiresAt: value.expiresAt,
    };
  }
  if (!Array.isArray(value.links) || value.links.length > 100)
    throw new WalletWebError("SERVICE_UNAVAILABLE");
  return {
    links: value.links.map((linked) => {
      if (
        !record(linked) ||
        typeof linked.id !== "string" ||
        !uuid.test(linked.id) ||
        linked.chainId !== 43114 ||
        typeof linked.addressLabel !== "string" ||
        !/^0x[a-fA-F0-9]{4}…[a-fA-F0-9]{4}$/.test(linked.addressLabel) ||
        typeof linked.matchesConnected !== "boolean" ||
        typeof linked.verifiedAt !== "string" ||
        !Number.isFinite(Date.parse(linked.verifiedAt))
      )
        throw new WalletWebError("SERVICE_UNAVAILABLE");
      return {
        id: linked.id,
        chainId: 43114 as const,
        addressLabel: linked.addressLabel,
        matchesConnected: linked.matchesConnected,
        verifiedAt: linked.verifiedAt,
      };
    }),
  };
}
export async function walletHandler(
  request: Request,
  dependencies: {
    enabled: boolean;
    webOrigin?: "http://localhost:3100" | "https://beta.evoverses.com";
    rpc: (
      operation: string,
      sessionToken: string,
      input: Record<string, unknown>,
    ) => Promise<unknown>;
  },
) {
  const reply = (status: number, body: unknown) =>
    Response.json(body, {
      status,
      headers: {
        "Cache-Control": "no-store",
        Pragma: "no-cache",
        "Referrer-Policy": "no-referrer",
        "X-Content-Type-Options": "nosniff",
      },
    });
  try {
    const url = new URL(request.url);
    const origin = dependencies.webOrigin ?? playerWebOrigin;
    const matchingUrl = origin === playerWebOrigin ? url.protocol === "http:" && url.port === "3100" : url.origin === origin;
    if (
      !dependencies.enabled ||
      !matchingUrl ||
      url.pathname !== "/api/player/wallet" ||
      url.search ||
      request.headers.get("host") !== new URL(origin).host ||
      request.headers.get("origin") !== origin
    )
      return reply(403, { error: { code: "ORIGIN_NOT_ALLOWED" } });
    if (request.method !== "POST")
      return reply(405, { error: { code: "METHOD_NOT_ALLOWED" } });
    const cookies = (request.headers.get("cookie") || "")
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.startsWith(playerSessionCookie + "="));
    if (cookies.length !== 1) throw new WalletWebError("INVALID_SESSION", 401);
    const token = cookies[0]!.slice(playerSessionCookie.length + 1);
    if (!/^[a-f0-9]{64}$/.test(token))
      throw new WalletWebError("INVALID_SESSION", 401);
    if (
      request.headers.get("content-type") !== "application/json" ||
      request.headers.has("content-encoding")
    )
      throw new WalletWebError("INVALID_REQUEST", 400);
    let size = 0;
    const parts: Uint8Array[] = [],
      reader = request.body?.getReader();
    if (!reader) throw new WalletWebError("INVALID_REQUEST", 400);
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      void reader.cancel();
    }, 2000);
    try {
      while (true) {
        const result = await reader.read();
        if (result.done) break;
        size += result.value.byteLength;
        if (size > 2048) {
          await reader.cancel();
          throw new WalletWebError("INVALID_REQUEST", 413);
        }
        parts.push(result.value);
      }
    } finally {
      clearTimeout(timer);
      reader.releaseLock();
    }
    if (timedOut) throw new WalletWebError("INVALID_REQUEST", 408);
    let input: unknown;
    try {
      input = JSON.parse(
        new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(parts)),
      );
    } catch {
      throw new WalletWebError("INVALID_REQUEST", 400);
    }
    if (
      !record(input) ||
      typeof input.operation !== "string" ||
      !Object.hasOwn(fields, input.operation)
    )
      throw new WalletWebError("INVALID_REQUEST", 400);
    const keys = ["operation", ...fields[input.operation]!];
    if (
      Object.keys(input).length !== keys.length ||
      Object.keys(input).some((k) => !keys.includes(k))
    )
      throw new WalletWebError("INVALID_REQUEST", 400);
    const body = Object.fromEntries(
      fields[input.operation]!.map((k) => [k, input[k]]),
    );
    return reply(
      200,
      walletReply(
        await dependencies.rpc(input.operation, token, body),
        input.operation,
      ),
    );
  } catch (error) {
    const known =
      error instanceof WalletWebError && Object.hasOwn(errors, error.code);
    return reply(known ? error.status : 503, {
      error: { code: known ? error.code : "SERVICE_UNAVAILABLE" },
    });
  }
}
