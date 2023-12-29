import { CollectionItemEvo, CollectionItemsResponse, CollectionMetadata } from "@/lib/evoverses/types";
import { cache } from "react";

const baseUrl = new URL("https://api.evoverses.com/v1/metadata/");
export const getCollectionMetadata = cache(async (collection: "evo" | "egg") => {
  const resp = await fetch("https://api.evoverses.com/v1/metadata/collection/evo", {
    next: {
      revalidate: 600,
    },
  });
  if (!resp.ok) {
    throw new Error(`Failed to get Evo collection metadata: ${resp.statusText}`);
  }

  return await resp.json() as CollectionMetadata;
});

export const getCollectionItems = cache(async (
  collection: "evo" | "egg" = "evo",
  limit: number = 50,
  offset: number = 0,
) => {
  const url = new URL(collection, baseUrl);
  if (limit !== 50) {
    url.searchParams.set("limit", limit.toString());
  }
  if (offset !== 0) {
    url.searchParams.set("offset", offset.toString());
  }
  const resp = await fetch(url, {
    next: {
      revalidate: 600,
    },
  });
  if (!resp.ok) {
    throw new Error(`Failed to get Evo collection items: ${resp.statusText}`);
  }

  return await resp.json() as CollectionItemsResponse;
});

export const getCollectionItem = cache(async (collection: "evo" | "egg" = "evo", tokenId: string) => {
  const url = new URL(`${collection}/${tokenId}`, baseUrl);
  url.searchParams.set("raw", "true");
  const resp = await fetch(url, {
    next: { revalidate: 600 },
  });
  if (!resp.ok) {
    throw new Error(`Failed to get Evo collection items: ${resp.statusText}`);
  }

  return await resp.json() as CollectionItemEvo;
});
