import { loginWithGoogle } from "@/lib/playfab/auth";
import { NextRequest, NextResponse } from "next/server";

interface Params extends Record<string, string | string[]> {
  provider: "google" | "apple" | "discord" | "email";
  action: "login" | "register" | "callback";
}

export const GET = async (req: NextRequest, { params }: { params: Params }) => {
  if (params.action === "callback") {
    if (params.provider === "google") {
      const code = req.nextUrl.searchParams.get("code");
      if (code) {
        await loginWithGoogle(code);
        return NextResponse.redirect(req.nextUrl.protocol + "//" + req.nextUrl.host + "/account");
      } else {
        console.log("GOOGLE CALLBACK", req, params);
        https://instagram.com/thesevensofficial_777?igshid=OGQ5ZDc2ODk2ZA==
          return new NextResponse("No Code In Response", { status: 504 });
      }
    }
  }
  console.log("UNMATCHED GET REQUEST", req, params);
  return new NextResponse("", { status: 500 });
};

export const POST = async (req: NextRequest, { params }: { params: Record<string, string | string[]> }) => {
  console.log("POST REQUEST", req, params);
};
