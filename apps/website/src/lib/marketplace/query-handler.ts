import { z } from "zod";
import { evoByIdQuery, evosByQueryQuery, evosMarketplaceSummaryQuery } from "../evo/queries";

const tokenId = z.string().regex(/^\d{1,30}$/);
const range = z.object({ gte: z.number().finite().nonnegative().optional(), lte: z.number().finite().nonnegative().optional() }).strict();
const attributes = z.record(z.enum(["price", "gender", "generation", "species", "nature", "element", "chroma", "total_breeds", "attack", "special", "defense", "resistance", "speed", "size", "level", "type", "treated"]), z.union([z.string().max(64), z.array(z.string().max(64)).max(100), range]));
const queries = {
  EvoByIdQuery: { query: evoByIdQuery, variables: z.object({ tokenId }).strict() },
  EvosByQueryQuery: { query: evosByQueryQuery, variables: z.object({
    owners: z.array(z.string().regex(/^0x[0-9a-fA-F]{40}$/)).max(20).optional(),
    listed: z.boolean().optional(), limit: z.number().int().min(1).max(100).optional(),
    page: z.number().int().min(0).max(100_000).optional(),
    sort: z.enum(["PRICE_LOW_TO_HIGH", "PRICE_HIGH_TO_LOW", "RECENTLY_LISTED", "HIGHEST_LAST_SALE", "LOWEST_LAST_SALE", "TOP_OFFER", "RECENTLY_SOLD"]).optional(),
    attributes: attributes.optional(),
  }).strict() },
  EvoMarketplaceSummaryQuery: { query: evosMarketplaceSummaryQuery, variables: z.object({ collection: z.literal("evos").optional() }).strict() },
};
const inputSchema = z.object({
  operationName: z.enum(["EvoByIdQuery", "EvosByQueryQuery", "EvoMarketplaceSummaryQuery"]),
  query: z.string().max(8_000), variables: z.record(z.string(), z.unknown()).default({}),
}).strict();

async function readInput(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Missing request.");
  const decoder = new TextDecoder(); let size = 0, text = "";
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 16_384) throw new Error("Request too large.");
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } finally { await reader.cancel(); }
}

// Public metadata only. Fixed upstream and authored queries; no arbitrary GraphQL or mutations.
export function createMarketplaceQueryHandler(upstream: string, fetcher: typeof fetch = fetch) {
  return async (request: Request): Promise<Response> => {
    const headers = { "Cache-Control": "no-store" };
    let operationName: keyof typeof queries, variables: Record<string, unknown>;
    try {
      const input = inputSchema.parse(await readInput(request));
      operationName = input.operationName;
      const spec = queries[operationName];
      if (input.query !== spec.query) throw new Error("Unexpected query.");
      variables = spec.variables.parse(input.variables);
    } catch {
      return Response.json({ error: "Invalid Marketplace query." }, { status: 400, headers });
    }
    try {
      const response = await fetcher(upstream, {
        method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ operationName, query: queries[operationName].query, variables }),
        cache: "no-store", signal: AbortSignal.timeout(12_000),
      });
      if (!response.ok) throw new Error("Metadata unavailable.");
      const result = await response.json();
      if (result.errors || !result.data) throw new Error("Metadata query failed.");
      return Response.json(result, { headers });
    } catch {
      return Response.json({ error: "Marketplace data is unavailable. Please try again." }, { status: 502, headers });
    }
  };
}
