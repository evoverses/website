import { createMarketplaceQueryHandler } from "@/lib/marketplace/query-handler";
import { squidUrl } from "@/lib/squid/shared";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const POST = createMarketplaceQueryHandler(squidUrl.toString());
