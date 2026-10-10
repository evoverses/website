import { fetchGraphQl } from "@/lib/graphql/utils";
import { squidUrl } from "@/lib/squid/shared";
import type { SquidErrorResponse } from "@/lib/squid/types";

export const fetchSquid = <TData = unknown>(
  operationName: string,
  query: string,
  variables: Record<string, unknown> = {},
  next: NextFetchRequestConfig = {},
) => fetchGraphQl<TData, SquidErrorResponse>(typeof window === "undefined" ? squidUrl : "/api/marketplace/query", operationName, query, variables, next);
