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
  source: "GeckoTerminal" | "DexScreener";
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
export const EVO_DEX_MARKET_URL =
  "https://api.dexscreener.com/latest/dex/pairs/avalanche/" + EVO_MARKET_POOL;
const dexSchema = z.object({
  pairs: z.array(z.object({
    chainId: z.string(),
    pairAddress: z.string(),
    baseToken: z.object({ address: z.string() }),
    priceUsd: z.string().nullable(),
  })),
});
export function parseDexEvoMarketQuote(raw: unknown, now = Date.now()): EvoMarketQuote {
  const pair = dexSchema.parse(raw).pairs.find(p =>
    p.chainId === "avalanche" &&
    p.pairAddress.toLowerCase() === EVO_MARKET_POOL &&
    p.baseToken.address.toLowerCase() === evoContractAddress.toLowerCase(),
  );
  if (!pair?.priceUsd) throw new Error("Unexpected EVO market.");
  positiveDecimal(pair.priceUsd);
  return { priceUsd: pair.priceUsd, fetchedAt: new Date(now).toISOString(), source: "DexScreener", poolAddress: EVO_MARKET_POOL };
}

// Share requests within a warm Worker and retain the original observation time.
// No historical/default price and no relabelling an old quote as newly fetched.
export function createEvoMarketQuoteFetcher(fetcher: typeof fetch = fetch, now = Date.now) {
  let cached: EvoMarketQuote | undefined;
  let pending: Promise<EvoMarketQuote> | undefined;
  const fetchLive = async (): Promise<EvoMarketQuote> => {
    for (const [url, parse] of [
      [EVO_MARKET_URL, parseEvoMarketQuote],
      [EVO_DEX_MARKET_URL, parseDexEvoMarketQuote],
    ] as const) {
      try {
        const response = await fetcher(url, {
          cache: "no-store",
          signal: AbortSignal.timeout(5_000),
          headers: { Accept: "application/json;version=20230302" },
        });
        if (!response.ok) throw new Error("EVO market data unavailable.");
        cached = parse(await response.json(), now());
        return cached;
      } catch {
        // Try the same verified Avalanche pool with the independent provider.
      }
    }
    throw new Error("EVO market data unavailable.");
  };
  return (): Promise<EvoMarketQuote> => {
    if (cached && now() - Date.parse(cached.fetchedAt) < 30_000)
      return Promise.resolve(cached);
    if (!pending) pending = fetchLive().finally(() => { pending = undefined; });
    return pending;
  };
}
const liveFetcher = createEvoMarketQuoteFetcher();
export function fetchEvoMarketQuote(fetcher?: typeof fetch): Promise<EvoMarketQuote> {
  return fetcher ? createEvoMarketQuoteFetcher(fetcher)() : liveFetcher();
}
