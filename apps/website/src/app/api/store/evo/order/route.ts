import { evoPurchase } from "@/lib/store/evo-purchase-handler";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { return evoPurchase(request, "find"); }
