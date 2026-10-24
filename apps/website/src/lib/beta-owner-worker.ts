import { playerSessionCookie } from "./player/auth-core";

type Environment = { EVOVERSES_BETA_OWNER_PLAYER_ID?: string };
type Context = { waitUntil(promise: Promise<unknown>): void };
type Worker<E> = { fetch(request: Request, env: E, ctx: Context): Promise<Response> };
const signInPaths = new Set([
  "/signin", "/api/player/auth/epic/start", "/api/player/auth/epic/callback",
  "/api/player/auth/epic/confirm", "/api/player/auth/logout",
]);
function privateResponse(response: Response) {
  const result = new Response(response.body, response);
  result.headers.set("Cache-Control", "private, no-store");
  result.headers.set("Pragma", "no-cache");
  result.headers.append("Vary", "Cookie");
  return result;
}
/** Restrict beta using the same authoritative session verification as the profile. */
export function createBetaOwnerWorker<E>(next: Worker<E>): Worker<E & Environment> {
  return { async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.hostname !== "beta.evoverses.com") return next.fetch(request, env, ctx);
    // Login must remain reachable after the owner's session expires. Public build assets
    // contain no account data and are also required to render that login page.
    if (url.pathname.startsWith("/_next/static/") || url.pathname === "/_next/image")
      return next.fetch(request, env, ctx);
    if (signInPaths.has(url.pathname)) return privateResponse(await next.fetch(request, env, ctx));
    const sessions = (request.headers.get("cookie") || "").split(";")
      .map(value => value.trim()).filter(value => value.startsWith(playerSessionCookie + "="));
    const owner = env.EVOVERSES_BETA_OWNER_PLAYER_ID;
    if (sessions.length === 1 && sessions[0]!.length > playerSessionCookie.length + 1 &&
        owner && /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(owner)) {
      try {
        const identityUrl = new URL("/api/player/me", url.origin);
        const identity = await next.fetch(new Request(identityUrl, {
          headers: { cookie: sessions[0]!, host: url.host, accept: "application/json" },
        }), env, ctx);
        if (identity.status === 200) {
          const account = await identity.json() as { player?: { id?: unknown } };
          if (account.player?.id === owner) return privateResponse(await next.fetch(request, env, ctx));
        }
      } catch { /* Unverified or unavailable sessions cannot enter beta. */ }
    }
    url.protocol = "https:"; url.hostname = "evoverses.com"; url.port = "";
    // A blocked POST must never be replayed as a purchase or account mutation on main.
    return privateResponse(new Response(null, {
      status: ["GET", "HEAD"].includes(request.method) ? 302 : 303,
      headers: { Location: url.toString() },
    }));
  } };
}
