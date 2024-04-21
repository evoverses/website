import { TokenResponse } from "@/types/dexscreener";
import type { Address } from "abitype";

export const fetchPairDataOf = async (address: string) => {
  const resp = await fetch("https://api.dexscreener.io/latest/dex/tokens/" + address, {
    next: {
      revalidate: 3_600
    }
  })
  if (!resp.ok) {
    throw new Error("Error fetching token price")
  }
  const data: TokenResponse = await resp.json();
  const pair = data.pairs.find(pair => pair.dexId
    === "traderjoe"
    && pair.chainId
    === "avalanche"
    && pair.baseToken.address
    === address);
  if (!pair) {
    throw new Error("Error finding pair");
  }
  return pair;
}

export const fetchPriceOf = async (address: Address) => {
  const pair = await fetchPairDataOf(address);
  return Number(pair.priceUsd);
};
