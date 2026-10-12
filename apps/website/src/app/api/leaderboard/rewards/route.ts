import { rewardsHandler } from "@/lib/leaderboard/rewards-handler";
import { rewardsRpc } from "@/lib/leaderboard/rewards-server";
import { getPlayerWebOrigin } from "@/lib/player/server";
export const runtime="nodejs";
export function POST(request:Request){return rewardsHandler(request,"admin",{origin:getPlayerWebOrigin(),rpc:rewardsRpc});}
