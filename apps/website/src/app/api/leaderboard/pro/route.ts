import { proHandler } from "@/lib/leaderboard/pro-handler";
import { proRpc } from "@/lib/leaderboard/rewards-server";
import { getPlayerWebOrigin } from "@/lib/player/server";
export const runtime="nodejs";
const handle=(request:Request)=>proHandler(request,{origin:getPlayerWebOrigin(),rpc:proRpc});
export const GET=handle,POST=handle;
