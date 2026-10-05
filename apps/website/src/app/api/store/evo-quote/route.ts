import { fetchEvoMarketQuote } from "@/lib/store/evo-price";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  try {
    return Response.json(await fetchEvoMarketQuote(), { headers });
  } catch {
    return Response.json(
      { error: "EVO price is unavailable. Please refresh the quote." },
      { status: 503, headers },
    );
  }
}
