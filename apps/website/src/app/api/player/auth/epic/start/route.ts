import { startEpic } from "@/lib/player/handlers";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const POST = startEpic;
