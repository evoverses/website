import { verifyAuthCookie } from "@/lib/thirdweb/auth.edge";
import { NextFetchEvent, type NextRequest, NextResponse } from "next/server";

export const middleware = async (request: NextRequest, event: NextFetchEvent) => {
  // Game-account pages verify their independent cookie against the player service.
  // Cookie presence alone never authorises a page or the wallet-only subroutes.
  if (process.env.NODE_ENV === "development" && process.env.EVOVERSES_LOCAL_EPIC_ACCOUNT_LOGIN === "1" && process.env.NEXT_PUBLIC_EVOVERSES_LOCAL_PLAYER_LOGIN === "1" && ["/profile", "/signin"].includes(request.nextUrl.pathname)) return NextResponse.next();
  const authResult = await verifyAuthCookie(request.cookies.get("ev:jwt"));
  const response = NextResponse.next();

  if (!response.headers.has("x-referer")) {
    response.headers.set("x-referer", request.nextUrl.toString());
  }

  if (!authResult.valid && "error" in authResult) {
    response.cookies.delete("ps:jwt");
    return response;
  }

  if (authResult.valid) {
    if (/^\/((sign(up|in)).*)/i.test(request.nextUrl.pathname)) {
      return NextResponse.redirect(new URL("/profile", request.nextUrl.toString()));
    }
  } else {
    if (/^\/((profile).*)/i.test(request.nextUrl.pathname)) {
      return NextResponse.redirect(new URL("/signin", request.nextUrl.toString()));
    }
  }
  return response;
};

// See "Matching Paths" below to learn more
export const config = {
  matcher: [ "/((?!api|_next/static|_next/image|favicon.ico).*)" ],
};
