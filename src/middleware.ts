import { auth } from "@/auth";
import { getMiddlewareAccountCookie, makeAccountCookie } from "@/lib/cookies/account.middleware";
import { NextFetchEvent, type NextRequest, NextResponse } from "next/server";
import { cookieToInitialState } from "wagmi";

export const middleware = async (request: NextRequest, event: NextFetchEvent) => {
  const wagmiState = cookieToInitialState({ storage: { key: "wagmi" } } as any, request.headers.get("cookie"));
  if (wagmiState && wagmiState.current) {
    const connection = wagmiState.connections.get(wagmiState.current);
    if (connection && connection.accounts.length > 0) {
      const address = connection.accounts[0];
      console.log(address);
      const accountCookie = getMiddlewareAccountCookie(request.cookies);
      if (address !== accountCookie.address) {
        const response = NextResponse.next();
        response.cookies.set(makeAccountCookie({ ...accountCookie, address }));
        return response;
      }
    }
  }
  return auth((request) => {
    if (!request.auth) {
      if (/^\/((profile).*)/i.test(request.nextUrl.pathname)) {
        return NextResponse.redirect(new URL("/signup", request.nextUrl.toString()));
      }
    } else {
      if (new Date(request.auth.playFab.EntityToken.TokenExpiration) < new Date()) {
        return NextResponse.redirect(new URL("/api/auth/signout", request.nextUrl.toString()));
      }
      if (/^\/((sign(up|in)).*)/i.test(request.nextUrl.pathname)) {
        return NextResponse.redirect(new URL("/profile", request.nextUrl.toString()));
      }
    }
    return NextResponse.next();
  })(request, event as any);
};

// See "Matching Paths" below to learn more
export const config = {
  matcher: [ "/((?!api|_next/static|_next/image|favicon.ico).*)" ],
};
