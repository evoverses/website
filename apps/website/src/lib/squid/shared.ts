export const squidFetchInit = {
  method: "POST",
  headers: { accept: "application/json", "content-type": "application/json" },
};

export const squidUrl = new URL(process.env.NEXT_PUBLIC_EVOVERSES_GRAPHQL_URL || "");
