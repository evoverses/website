import { fetchSquidAssets } from "@/lib/evo/fetch";
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
    const assets = await fetchSquidAssets(
      { owners: [owner.toLowerCase() as Address], limit: 48, page },
      { revalidate: 0 },
    );
    return NextResponse.json(assets, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json(
      { error: "The Evo data service is unavailable. Please retry shortly." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
