import { z } from "zod";
import { evoContractAddress } from "../../data/addresses";
import { positiveDecimal } from "./pricing";
export const EVO_MARKET_POOL = "0xb99a92b6d5a7ca3a2215a63d43d5e8ad43abc4e9";
export const EVO_MARKET_URL =
  "https://api.geckoterminal.com/api/v2/networks/avax/tokens/" +
  evoContractAddress.toLowerCase();
export type EvoMarketQuote = {
  priceUsd: string;
  fetchedAt: string;
  source: "GeckoTerminal";
  poolAddress: string;
};
const schema = z.object({
  data: z.object({
    id: z.string(),
    type: z.literal("token"),
    attributes: z.object({
      address: z.string(),
      decimals: z.literal(18),
      price_usd: z.string(),
    }),
    relationships: z.object({
      top_pools: z.object({ data: z.array(z.object({ id: z.string() })) }),
    }),
  }),
});
export function parseEvoMarketQuote(
  raw: unknown,
  now = Date.now(),
): EvoMarketQuote {
  const { data } = schema.parse(raw);
  if (
    data.id.toLowerCase() !== "avax_" + evoContractAddress.toLowerCase() ||
    data.attributes.address.toLowerCase() !==
      evoContractAddress.toLowerCase() ||
    data.relationships.top_pools.data[0]?.id.toLowerCase() !==
      "avax_" + EVO_MARKET_POOL
  )
    throw new Error("Unexpected EVO market.");
  positiveDecimal(data.attributes.price_usd);
  return {
    priceUsd: data.attributes.price_usd,
    fetchedAt: new Date(now).toISOString(),
    source: "GeckoTerminal",
    poolAddress: EVO_MARKET_POOL,
  };
}
export async function fetchEvoMarketQuote(
  fetcher: typeof fetch = fetch,
): Promise<EvoMarketQuote> {
  const response = await fetcher(EVO_MARKET_URL, {
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
    headers: {
      Accept: "application/json;version=20230302",
      "User-Agent": "EvoVersesStore/1.0",
    },
  });
  if (!response.ok) throw new Error("EVO market data unavailable.");
  return parseEvoMarketQuote(await response.json());
}
