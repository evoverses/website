import { auth } from "@/auth";
import { NextFetchEvent, type NextRequest, NextResponse } from "next/server";

export const middleware = async (request: NextRequest, event: NextFetchEvent) => {
  return auth((request) => {
    if (!request.auth) {
      if (/^\/((profile).*)/i.test(request.nextUrl.pathname)) {
        return NextResponse.redirect(new URL("/signup", request.nextUrl.toString()));
      }
    } else {
      if (new Date(request.auth.playFab.EntityToken.TokenExpiration) < new Date()) {
        if (!/^\/((signout).*)/i.test(request.nextUrl.pathname)) {
          return NextResponse.redirect(new URL("/signout", request.nextUrl.toString()));
        }
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
