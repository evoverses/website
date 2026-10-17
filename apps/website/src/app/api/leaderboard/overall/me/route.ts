import { readBoard } from "@/lib/leaderboard/boards-server";
import type { NextRequest } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = (request: NextRequest) => readBoard(request, "overall", true);
