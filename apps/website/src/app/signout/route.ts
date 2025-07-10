import { logout } from "@/lib/thirdweb/auth";
import { type NextRequest, NextResponse } from "next/server";

export const GET = async (request: NextRequest) => {
  await logout();
  const url = request.nextUrl.clone();
  url.searchParams.forEach((value, key) => url.searchParams.delete(key));
  url.pathname = "/";
  return NextResponse.redirect(url.toString());
};
