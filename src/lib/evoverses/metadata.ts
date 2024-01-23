import {
  CollectionMetadata,
  EvoCollectionResponse,
  EvoEggCollectionResponse,
  RawEvo,
  RawEvoEgg,
} from "@/lib/evoverses/types";
import { Slug } from "@/types/core";
import { cache } from "react";

const baseUrl = new URL("https://api.evoverses.com/v1/metadata/");
export const getCollectionMetadata = cache(async (slug: Slug): Promise<CollectionMetadata> => {
  const resp = await fetch(`https://api.evoverses.com/metadata/collection/${slug}`, {
    next: {
      revalidate: 600,
    },
  });
  if (!resp.ok) {
    console.error(`Failed to get Evo collection metadata: ${resp.statusText}`);
    return {
      address: "0x4151b8afa10653d304FdAc9a781AFccd45EC164c",
      bannerImage: "",
      collaborators: [],
      createdAt: "",
      description: "Evos are powerful 3D monsters that roam the world with unique abilities and are prone to fights!",
      externalLink: "",
      id: 0,
      image: "",
      name: "Evos",
      updatedAt: "",

    };
  }

  return await resp.json();
});

export const getCollectionItems = cache(async (
  slug: Slug = "evo",
  limit: number = 50,
  offset: number = 0,
) => {
  const url = new URL(slug, baseUrl);
  if (limit !== 50) {
    url.searchParams.set("limit", limit.toString());
  }
  if (offset !== 0) {
    url.searchParams.set("offset", offset.toString());
  }
  const resp = await fetch(url, { next: { revalidate: 600 } });
  if (!resp.ok) {
    throw new Error(`Failed to get Evo collection items: ${resp.statusText}`);
  }
  const json = await resp.json();
  return slug === "evo" ? json as EvoCollectionResponse : json as EvoEggCollectionResponse;
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
  const json = await resp.json();
  return collection === "evo" ? json as RawEvo : json as RawEvoEgg;
});
