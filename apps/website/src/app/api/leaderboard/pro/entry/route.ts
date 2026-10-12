import { entryHandler } from "@/lib/leaderboard/pro-entry-handler";
import { entryRpc } from "@/lib/leaderboard/rewards-server";
import { getPlayerWebOrigin } from "@/lib/player/server";
export const runtime='nodejs';
export const POST=(request:Request)=>entryHandler(request,{origin:getPlayerWebOrigin(),rpc:entryRpc});
