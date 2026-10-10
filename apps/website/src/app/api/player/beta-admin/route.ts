import { betaAdminHandler } from "@/lib/player/beta-admin-handler";
import { betaAdminRpc } from "@/lib/player/beta-admin-server";
import { playerLoginEnabled, getPlayerWebOrigin } from "@/lib/player/server";
export const runtime = "nodejs";
export function POST(request: Request) {
  return betaAdminHandler(request, { enabled: playerLoginEnabled, webOrigin: getPlayerWebOrigin(), rpc: betaAdminRpc });
}
