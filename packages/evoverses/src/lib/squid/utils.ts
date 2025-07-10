import { fetchGraphQl } from "@workspace/evoverses/lib/graphql/utils";
import type { SquidErrorResponse } from "@workspace/evoverses/lib/squid/types";
import type { NextFetchRequestConfig } from "@workspace/evoverses/types/next";
import { assertEnvNotNull } from "@workspace/evoverses/utils/node";

const squidUrl = process.env.NEXT_PUBLIC_EVOVERSES_GRAPHQL_URL;

export const fetchSquid = <TData = unknown>(
  operationName: string,
  query: string,
  variables: Record<string, unknown> = {},
  next: NextFetchRequestConfig = {},
) => {
  const url = squidUrl || assertEnvNotNull(process.env.EVOVERSES_GRAPHQL_URL, "EVOVERSES_GRAPHQL_URL");
  return fetchGraphQl<TData, SquidErrorResponse>(url, operationName, query, variables, next);
};
