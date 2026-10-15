import { fujiAsset } from "@/lib/nursery/fuji-assets";
import { permission, AccessError } from "@/lib/downloads/server";
import { privateHeaders } from "@/lib/downloads/core";
import { type NextRequest } from "next/server";
import { isAddress, type Address } from "viem";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest, context: { params: Promise<{ tokenId: string }> }) {
  const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: privateHeaders() });
  try {
    await permission(true, true);
    const { tokenId } = await context.params;
    const owner = request.nextUrl.searchParams.get("owner") ?? "";
    if (!isAddress(owner, { strict: false }) || !/^[1-9][0-9]{0,77}$/.test(tokenId) || BigInt(tokenId) >= 2n ** 256n) return reply({ error: "INVALID_REQUEST" }, 400);
    return reply(await fujiAsset(owner.toLowerCase() as Address, BigInt(tokenId)));
  } catch (error) {
    return reply({ error: error instanceof AccessError ? error.code : "EVO_UNAVAILABLE" }, error instanceof AccessError ? error.status : 503);
  }
}
