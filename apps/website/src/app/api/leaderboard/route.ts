import { readLeaderboard } from "@/lib/leaderboard/server";
import type { NextRequest } from "next/server";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const GET=(request:NextRequest)=>readLeaderboard(request,false);
