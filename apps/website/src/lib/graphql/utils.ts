import type { GraphQLResponse } from "@/lib/graphql/types";
import { getSafeResponseError } from "@/utils/node";

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
    next,
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
