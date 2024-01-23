// noinspection JSUnusedGlobalSymbols,DuplicatedCode

import { OpenSeaAPI } from "@/lib/opensea/types";
import { cache } from "react";
import Account = OpenSeaAPI.Accounts.Account;
import Address = OpenSeaAPI.Address;
import Chain = OpenSeaAPI.Chain;
import Collection = OpenSeaAPI.Collections.Collection;
import CollectionsResponse = OpenSeaAPI.Collections.Responses.CollectionsResponse;
import CollectionStatsResponse = OpenSeaAPI.Collections.Responses.CollectionStatsResponse;
import Contract = OpenSeaAPI.NFTs.Contract;
import EventType = OpenSeaAPI.NFTs.Events.EventType;
import EventsResponse = OpenSeaAPI.NFTs.Events.Responses.EventsResponse;
import Identifier = OpenSeaAPI.NFTs.Identifier;
import NFTResponse = OpenSeaAPI.NFTs.Responses.NFTResponse;
import NFTsResponse = OpenSeaAPI.NFTs.Responses.NFTsResponse;
import TraitsResponse = OpenSeaAPI.NFTs.Responses.TraitsResponse;

const BASE_URL = new URL("/api/v2/", "https://api.opensea.io/");
const openseaOptions = { headers: { accept: "application/json", "x-api-key": process.env.OPENSEA_API_KEY || "" } };
const nextOptions = { next: { revalidate: 3600 } };
const options = { ...openseaOptions, ...nextOptions };

export const getAccount = cache(async (address: Address) => {
  const url = new URL(`accounts/${address}`, BASE_URL);
  const resp = await fetch(url, options);
  if (!resp.ok) {
    throw new Error(`Failed to fetch ${url}: ${resp.status} ${resp.statusText}`);
  }
  return await resp.json() as Account;
});

export const getContract = cache(async (address: Address, chain: Chain) => {
  const url = new URL(`chain/${chain}/contract/${address}`, BASE_URL);
  const resp = await fetch(url, options);
  if (!resp.ok) {
    throw new Error(`Failed to fetch ${url}: ${resp.status} ${resp.statusText}`);
  }
  return await resp.json() as Contract;
});

export const getCollection = cache(async (collection: string) => {
  const url = new URL(`collections/${collection}`, BASE_URL);
  const resp = await fetch(url, options);
  if (!resp.ok) {
    throw new Error(`Failed to fetch ${url}: ${resp.status} ${resp.statusText}`);
  }
  return await resp.json() as Collection;
});

export const getCollections = cache(async (
  chain: Chain,
  includeHidden: boolean = false,
  limit: number = 50,
  next: string = "",
) => {
  const apiLimit = Math.max(Math.min(limit, 200), 0);
  const url = new URL(`collections`, BASE_URL);
  url.searchParams.set("chain_identifier", chain);
  if (apiLimit !== 50) {
    url.searchParams.set("limit", apiLimit.toString());
  }
  if (includeHidden) {
    url.searchParams.set("include_hidden", "true");
  }
  if (next) {
    url.searchParams.set("next", next);
  }
  const resp = await fetch(url, options);
  if (!resp.ok) {
    throw new Error(`Failed to fetch ${url}: ${resp.status} ${resp.statusText}`);
  }
  return await resp.json() as CollectionsResponse;
});

export const getNft = cache(async (address: Address, chain: Chain, identifier: Identifier) => {
  const url = new URL(`chain/${chain}/contract/${address}/nfts/${identifier}`, BASE_URL);
  const resp = await fetch(url, options);
  if (!resp.ok) {
    throw new Error(`Failed to fetch ${url}: ${resp.status} ${resp.statusText}`);
  }
  return await resp.json() as NFTResponse;
});

export const getNftsOfAccount = cache(async (
  address: Address,
  chain: Chain,
  collection: string = "",
  limit: number = 50,
  next: string = "",
) => {
  const apiLimit = Math.max(Math.min(limit, 200), 0);
  const url = new URL(`chain/${chain}/account/${address}/nfts`, BASE_URL);
  if (apiLimit !== 50) {
    url.searchParams.set("limit", apiLimit.toString());
  }
  if (collection) {
    url.searchParams.set("collection", collection);
  }
  if (next) {
    url.searchParams.set("next", next);
  }
  const resp = await fetch(url, options);
  if (!resp.ok) {
    throw new Error(`Failed to fetch ${url}: ${resp.status} ${resp.statusText}`);
  }
  return await resp.json() as NFTsResponse;
});

export const getNftsOfCollection = cache(async (collection: string, limit: number = 50, next: string = "") => {
  const apiLimit = Math.max(Math.min(limit, 200), 0);
  const url = new URL(`collection/${collection}/nfts`, BASE_URL);
  if (apiLimit !== 50) {
    url.searchParams.set("limit", apiLimit.toString());
  }
  if (next) {
    url.searchParams.set("next", next);
  }
  const resp = await fetch(url, options);
  if (!resp.ok) {
    throw new Error(`Failed to fetch ${url}: ${resp.status} ${resp.statusText}`);
  }
  return await resp.json() as NFTsResponse;
});

export const getNftsOfContract = cache(async (
  address: Address,
  chain: Chain,
  limit: number = 50,
  next: string = "",
) => {
  const apiLimit = Math.max(Math.min(limit, 200), 0);
  const url = new URL(`chain/${chain}/contract/${address}/nfts`, BASE_URL);
  if (apiLimit !== 50) {
    url.searchParams.set("limit", apiLimit.toString());
  }
  if (next) {
    url.searchParams.set("next", next);
  }
  const resp = await fetch(url, options);
  if (!resp.ok) {
    throw new Error(`Failed to fetch ${url}: ${resp.status} ${resp.statusText}`);
  }
  return await resp.json() as NFTsResponse;
});

export const getTraits = cache(async (collection: string) => {
  const url = new URL(`traits/${collection}`, BASE_URL);
  const resp = await fetch(url, { ...options, next: { revalidate: 3600 } });
  if (!resp.ok) {
    throw new Error(`Failed to fetch ${url}: ${resp.status} ${resp.statusText}`);
  }
  return await resp.json() as TraitsResponse;
});

export const refreshNftMetadata = cache(async (address: Address, chain: Chain, identifier: Identifier) => {
  const url = new URL(`chain/${chain}/contract/${address}/nfts/${identifier}/refresh`, BASE_URL);
  const resp = await fetch(url, { ...openseaOptions, method: "POST" });
  if (!resp.ok) {
    throw new Error(`Failed to fetch ${url}: ${resp.status} ${resp.statusText}`);
  }
  return resp.ok;
});

export const getCollectionStats = cache(async (collection: string): Promise<CollectionStatsResponse> => {
  const url = new URL(`collections/${collection}/stats`, BASE_URL);
  const resp = await fetch(url, options);
  if (!resp.ok) {
    console.error(`Failed to fetch ${url}: ${resp.status} ${resp.statusText}`);
    return {
      intervals: [],
      total: {
        volume: 0,
        sales: 0,
        average_price: 0,
        num_owners: 0,
        market_cap: 0,
        floor_price: 0,
        floor_price_symbol: "AVAX",
      },
    };
  }
  return resp.json();
});

export const getNftEvents = cache(async (
  address: Address,
  chain: Chain,
  identifier: Identifier,
  eventType: EventType[],
  after: number = 0,
  before: number = 0,
  next = "",
) => {
  const url = new URL(`events/chain/${chain}/contract/${address}/nfts/${identifier}`, BASE_URL);
  const resp = await fetch(url, openseaOptions);
  if (after) {
    url.searchParams.set("after", after.toString());
  }
  if (before) {
    url.searchParams.set("before", before.toString());
  }
  if (next) {
    url.searchParams.set("next", next);
  }
  if (eventType.length) {
    for (const et of eventType) {
      url.searchParams.append("event_type", et);
    }
  }
  if (!resp.ok) {
    throw new Error(`Failed to fetch ${url}: ${resp.status} ${resp.statusText}`);
  }
  return await resp.json() as EventsResponse;
});
