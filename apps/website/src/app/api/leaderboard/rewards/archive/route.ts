import { rewardsHandler } from "@/lib/leaderboard/rewards-handler";
import { rewardsRpc } from "@/lib/leaderboard/rewards-server";
import { getPlayerWebOrigin } from "@/lib/player/server";
export const runtime="nodejs";
export function GET(request:Request){return rewardsHandler(request,"archive",{origin:getPlayerWebOrigin(),rpc:rewardsRpc});}
