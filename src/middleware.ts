import { verifyAuthCookie } from "@/thirdweb/auth";
import { NextFetchEvent, type NextRequest, NextResponse } from "next/server";

export const middleware = async (request: NextRequest, event: NextFetchEvent) => {
  const authResult = await verifyAuthCookie(request.cookies.get("ev:jwt"));

  if (authResult.valid) {
    if (/^\/((sign(up|in)).*)/i.test(request.nextUrl.pathname)) {
      return NextResponse.redirect(new URL("/profile", request.nextUrl.toString()));
    }
  } else {
    if (/^\/((profile).*)/i.test(request.nextUrl.pathname)) {
      return NextResponse.redirect(new URL("/signin", request.nextUrl.toString()));
    }
  }
  return NextResponse.next();
};

// See "Matching Paths" below to learn more
export const config = {
  matcher: [ "/((?!api|_next/static|_next/image|favicon.ico).*)" ],
};
