import { EVO_MARKET_POOL, type EvoMarketQuote } from "./evo-price";
import { positiveDecimal, quoteIsFresh } from "./pricing";
export async function fetchHostedEvoQuote(
  connection: { apiUrl: string; token: string },
  fetcher: typeof fetch = fetch,
): Promise<EvoMarketQuote> {
  const response = await fetcher(connection.apiUrl + "/internal/store", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-EvoVerses-Service": connection.token },
    body: JSON.stringify({ operation: "evo-quote" }),
    cache: "no-store", redirect: "manual", credentials: "omit",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw Error("EVO quote unavailable HTTP " + response.status + ".");
  const text = await response.text();
  if (text.length > 8192) throw Error("Invalid EVO quote.");
  const value = JSON.parse(text)?.value;
  if (!value || typeof value.priceUsd !== "string" || value.poolAddress !== EVO_MARKET_POOL ||
      !["Avalanche"].includes(value.source) || !quoteIsFresh(value.fetchedAt))
    throw Error("Invalid EVO quote.");
  if (value.chainId !== 43114 || !/^\d+$/.test(value.blockNumber ?? "") ||
      value.oracleAddress !== "0x0a77230d17318075983913bc2145db16c7366156" || !quoteIsFresh(value.oracleUpdatedAt))
    throw Error("Invalid EVO oracle.");
  positiveDecimal(value.priceUsd);
  return value;
}
