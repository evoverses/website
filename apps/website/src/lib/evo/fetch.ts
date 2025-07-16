import { evoByIdQuery, evosByQueryQuery, evosMarketplaceSummaryQuery } from "@/lib/evo/queries";
import { Range } from "@/types/generic";
import type { SquidAsset, SquidMarketplaceSummary } from "@workspace/evoverses/lib/asset/types";
import { toSnakeCase } from "@workspace/evoverses/utils/strings";
import type { Address } from "viem";
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
  attributes?: SquidFormattedAttributeFilter;
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

type SquidAttributeFiltersInput = Record<string, string | string[] | Range>

export type SquidFormattedAttributeFilter = Record<string, Record<string, number> | string[] | string>
export const buildSquidAttributeFilters = (filters: Partial<SquidAttributeFiltersInput>) => {
  const attributes: SquidFormattedAttributeFilter = {};

  const addStringFilter = (key: string, value: string) => {
    if (value && value !== "ALL") {
      attributes[key] = value;
    }
  };
  const addArrayFilter = (key: string, values: string[] = []) => {
    const valid = values.filter(v => v !== "ALL");
    if (valid.length > 0) {
      attributes[key] = valid;
    }
  };

  const addRangeFilter = (key: string, range: Range = {}) => {
    const filter: Record<string, number> = {};
    if (range.min !== undefined) {
      filter.gte = range.min;
    }
    if (range.max !== undefined) {
      filter.lte = range.max;
    }
    if (Object.keys(filter).length > 0) {
      attributes[key] = filter;
    }
  };
  for (const [ key, value ] of Object.entries(filters)) {
    if (typeof value === "string") {
      addStringFilter(toSnakeCase(key), value);
    } else if (Array.isArray(value)) {
      addArrayFilter(toSnakeCase(key), value);
    } else {
      addRangeFilter(toSnakeCase(key), value);
    }
  }

  return Object.keys(attributes).length > 0 ? attributes : undefined;
};

export const fetchSquidMarketplaceSummary = async (collection: string) => {
  const result = await fetchSquid<{ evosMarketplaceSummary: SquidMarketplaceSummary }>(
    "EvoMarketplaceSummaryQuery",
    evosMarketplaceSummaryQuery,
    { collection },
  );
  return result.evosMarketplaceSummary;
};
