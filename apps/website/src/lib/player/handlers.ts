import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { epicPendingCookie, epicStateCookie, PlayerWebError, playerSessionCookie, playerWebOrigin } from "./auth-core";
import { playerWebAuth, getPlayerAccount, getPlayerInventory, localPlayerLogin } from "./server";

function protect(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
}
function allowedHost(request: NextRequest, mutation = false) {
  return localPlayerLogin && new URL(request.url).protocol === "http:" && new URL(request.url).port === "3100" && request.headers.get("host") === "localhost:3100" && (!mutation || request.headers.get("origin") === playerWebOrigin);
}
function forbidden() { return protect(NextResponse.json({ error: { code: "ORIGIN_NOT_ALLOWED" } }, { status: 403 })); }
function redirect(path: string) { return protect(NextResponse.redirect(new URL(path, playerWebOrigin), 303)); }
function clear(response: NextResponse, name: string, path = "/") { response.cookies.set(name, "", { path, maxAge: 0, httpOnly: true, sameSite: "lax" }); }
const statuses = new Set(["SIGNIN_UNAVAILABLE", "SIGNIN_EXPIRED", "SIGNIN_BUSY", "EPIC_CANCELLED", "EPIC_VERIFICATION_FAILED", "SERVICE_UNAVAILABLE", "INVALID_SESSION"]);
function failure(error: unknown) {
  const code = error instanceof PlayerWebError && statuses.has(error.code) ? error.code : "SERVICE_UNAVAILABLE";
  const response = redirect("/signin?status=" + code);
  clear(response, epicStateCookie, "/api/player/auth/epic");
  clear(response, epicPendingCookie);
  return response;
}
function session(result: { token: string; expiresAt: number }) {
  const response = redirect("/profile");
  response.cookies.set(playerSessionCookie, result.token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: Math.max(0, Math.min(900, Math.floor(result.expiresAt - Date.now() / 1000))) });
  clear(response, epicStateCookie, "/api/player/auth/epic");
  clear(response, epicPendingCookie);
  return response;
}
export async function startEpic(request: NextRequest) {
  try {
    if (!allowedHost(request, true)) return forbidden();
    const result = playerWebAuth().start();
    const response = protect(NextResponse.redirect(result.url, 303));
    response.cookies.set(epicStateCookie, result.cookie, { httpOnly: true, sameSite: "lax", path: "/api/player/auth/epic", maxAge: 300 });
    clear(response, epicPendingCookie);
    return response;
  } catch (error) { return failure(error); }
}
export async function epicCallback(request: NextRequest) {
  try {
    if (!allowedHost(request)) return forbidden();
    const params = new URL(request.url).searchParams;
    if (request.url.length > 8192 || params.getAll("state").length !== 1 || params.getAll("code").length > 1 || params.getAll("error").length > 1 || (params.has("code") && params.has("error"))) throw new PlayerWebError("SIGNIN_EXPIRED");
    const result = await playerWebAuth().callback({ state: params.get("state") || "", cookie: request.cookies.get(epicStateCookie)?.value || "", code: params.get("code") || undefined, cancelled: params.has("error") });
    if (result.session) return session(result.session);
    const response = redirect("/signin?confirm=1");
    response.cookies.set(epicPendingCookie, result.pendingCookie!, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 });
    clear(response, epicStateCookie, "/api/player/auth/epic");
    return response;
  } catch (error) { return failure(error); }
}
export async function confirmEpic(request: NextRequest) {
  try { if (!allowedHost(request, true)) return forbidden(); return session(await playerWebAuth().confirm(request.cookies.get(epicPendingCookie)?.value || "")); }
  catch (error) { return failure(error); }
}
export async function signOutPlayer(request: NextRequest) {
  try {
    if (!allowedHost(request, true)) return forbidden();
    const token = request.cookies.get(playerSessionCookie)?.value;
    if (token) await playerWebAuth().logout(token);
    const response = redirect("/signin?status=SIGNED_OUT");
    clear(response, playerSessionCookie); clear(response, epicPendingCookie);
    clear(response, epicStateCookie, "/api/player/auth/epic");
    return response;
  } catch (error) {
    // Clear this browser even if the backend is offline. Do not claim server revocation succeeded.
    const response = failure(error); clear(response, playerSessionCookie); return response;
  }
}
export async function playerMe(request: NextRequest) {
  try {
    if (!allowedHost(request)) return forbidden();
    const account = await getPlayerAccount();
    if (!account) return protect(NextResponse.json({ error: { code: "INVALID_SESSION" } }, { status: 401 }));
    return protect(NextResponse.json({ ...account, inventory: await getPlayerInventory() }));
  } catch { return protect(NextResponse.json({ error: { code: "SERVICE_UNAVAILABLE" } }, { status: 503 })); }
}
