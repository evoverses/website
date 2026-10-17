import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getEpicConfig, getPlayerWebOrigin } from "@/lib/player/server";
import { playerSessionCookie } from "@/lib/player/auth-core";
import { boardRpc, boardSelection, type ProgressionBoard } from "./boards-core";

export async function readBoard(request: NextRequest, board: ProgressionBoard, privateRead = false) {
  const respond = (status: number, body: unknown) => NextResponse.json(body, {status, headers: {
    "Cache-Control": status === 200 && !privateRead ? "public, max-age=60" : "no-store",
    "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer",
  }});
  try {
    const origin = getPlayerWebOrigin();
    if (request.nextUrl.origin !== origin || request.headers.get("host") !== new URL(origin).host) return respond(403, {error: {code: "ORIGIN_NOT_ALLOWED"}});
    let input;
    try { input = boardSelection(request.nextUrl, board); } catch { return respond(400, {error: {code: "INVALID_REQUEST"}}); }
    const config = getEpicConfig();
    if (!config?.hosted) return respond(503, {error: {code: "LEADERBOARD_UNAVAILABLE"}});
    const token = privateRead ? (await cookies()).get(playerSessionCookie)?.value : undefined;
    if (privateRead && !token) return respond(401, {error: {code: "INVALID_SESSION"}});
    const result = await boardRpc({connection: {apiUrl: config.apiUrl, serviceToken: config.hosted.serviceToken}, board, selection: input, token});
    return respond(200, privateRead ? {own: result.own, ownRow: result.ownRow, calculatedAt: result.calculatedAt} : result);
  } catch (error) {
    const status = error && typeof error === "object" && "status" in error && [401, 403].includes(Number(error.status)) ? Number(error.status) : 503;
    return respond(status, {error: {code: status === 401 ? "INVALID_SESSION" : status === 403 ? "ACCOUNT_UNAVAILABLE" : "LEADERBOARD_UNAVAILABLE"}});
  }
}
