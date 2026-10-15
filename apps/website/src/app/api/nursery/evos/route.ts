import { fujiAssets } from "@/lib/nursery/fuji-assets";
import { permission, AccessError } from "@/lib/downloads/server";
import { type NextRequest, NextResponse } from "next/server";
import { isAddress, type Address } from "viem";

export const dynamic = "force-dynamic";

// Fixed, read-only query: the browser cannot select an upstream URL or operation.
export async function GET(request: NextRequest) {
  const owner = request.nextUrl.searchParams.get("owner") ?? "";
  const pageValue = request.nextUrl.searchParams.get("page") ?? "0";
  const page = Number(pageValue);
  if (
    !isAddress(owner, { strict: false }) ||
    !/^\d+$/.test(pageValue) ||
    !Number.isSafeInteger(page) ||
    page > 100_000
  ) {
    return NextResponse.json({ error: "Invalid wallet address or page." }, { status: 400 });
  }
  try {
    await permission(true, true);
    const assets = await fujiAssets(owner.toLowerCase() as Address, page);
    return NextResponse.json(assets, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof AccessError) return NextResponse.json({ error: error.code }, { status: error.status, headers: { "Cache-Control": "private, no-store" } });
    return NextResponse.json(
      { error: "The Evo data service is unavailable. Please retry shortly." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
