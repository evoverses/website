import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const middleware = auth((request) => {
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
});

// See "Matching Paths" below to learn more
export const config = {
  matcher: [ "/((?!api|_next/static|_next/image|favicon.ico).*)" ],
};
