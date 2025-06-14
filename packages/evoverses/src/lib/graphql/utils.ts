import type { GraphQLResponse } from "@workspace/evoverses/lib/graphql/types";
import type { NextFetchRequestConfig } from "@workspace/evoverses/types/next";
import { getSafeResponseError } from "@workspace/evoverses/utils/node";

export const fetchGraphQl = async <TData = unknown, TError = unknown>(
  url: URL | string,
  operationName: string,
  query: string,
  variables: Record<string, unknown> = {},
  next: NextFetchRequestConfig = {},
) => {
  const resp = await fetch(url, {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({ operationName, query, variables }),
    ...(
      next ? { next } : {}
    ),
  });
  if (!resp.ok) {
    throw new Error(await getSafeResponseError(resp));
  }
  const data: GraphQLResponse<TData, TError> = await resp.json();
  if ("errors" in data) {
    console.error(data);
    throw new Error(String(data.errors));
  }
  return data.data;
};
