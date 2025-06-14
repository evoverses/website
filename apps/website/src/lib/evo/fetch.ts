import { evoByIdQuery, evosByQueryQuery } from "@/lib/evo/queries";
import type { Address } from "viem";
import { SquidAsset } from "../squid/types";
import { fetchSquid } from "../squid/utils";

export const fetchSquidAsset = async (tokenId: string, next: NextFetchRequestConfig = {}) => {
  const result = await fetchSquid<{ evoById: SquidAsset }>(
    "EvoByIdQuery",
    evoByIdQuery,
    { tokenId },
    next,
  );
  return result.evoById;
};

export type FetchSquidAssetsOptions = {
  owners?: Address[];
  listed?: boolean;
  limit?: number;
  page?: number;
  sort?: string;
  tokenIds?: string[];
}

export const fetchSquidAssets = async (opts: FetchSquidAssetsOptions = {}, next: NextFetchRequestConfig = {}) => {
  const result = await fetchSquid<{ evosByQuery: { items: SquidAsset[], nextPage: number | null, total: number } }>(
    "EvosByQueryQuery",
    evosByQueryQuery,
    Object.entries(opts).reduce((o, [ key, value ]) => {
      if (value !== undefined && value !== null && value !== "") {
        o[key] = value;
      }
      return o;
    }, {} as Record<string, unknown>),
    next,
  );
  console.log("RESULT:", result, result.evosByQuery);
  return result.evosByQuery;
};
