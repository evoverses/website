import { evoByIdQuery, evosByQueryQuery } from "@workspace/evoverses/lib/asset/queries";
import type { SquidAsset } from "@workspace/evoverses/lib/asset/types";
import { fetchSquid } from "@workspace/evoverses/lib/squid/utils";
import type { NextFetchRequestConfig } from "@workspace/evoverses/types/next";
import type { Address } from "@workspace/evoverses/types/viem";

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
  // console.log("RESULT:", result, result.evosByQuery);
  return result.evosByQuery;
};
