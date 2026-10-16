import { fetchEvoMarketQuote } from "@/lib/store/evo-price";
import { getEpicConfig } from "@/lib/player/server";
import { fetchHostedEvoQuote } from "@/lib/store/hosted-evo-quote";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  try {
    const config = getEpicConfig();
    const quote = config?.hosted
      ? await fetchHostedEvoQuote({ apiUrl: config.apiUrl, token: config.hosted.serviceToken })
      : await fetchEvoMarketQuote();
    return Response.json(quote, { headers });
  } catch {
    return Response.json(
      { error: "EVO price is unavailable. Please refresh the quote." },
      { status: 503, headers },
    );
  }
}
