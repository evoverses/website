import type { Pair, TokenResponse } from "@/types/dexscreener";
import type { Address } from "abitype";
import { toast } from "sonner";

const fallbackPairs: Pair[] = [
  {
    chainId: "avalanche",
    dexId: "traderjoe",
    url: "https://dexscreener.com/avalanche/0xb99a92b6d5a7ca3a2215a63d43d5e8ad43abc4e9",
    pairAddress: "0xb99A92B6d5a7CA3a2215A63d43D5E8ad43ABC4e9",
    baseToken: { address: "0x42006Ab57701251B580bDFc24778C43c9ff589A1", name: "EVO", symbol: "EVO" },
    quoteToken: { address: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7", name: "Wrapped AVAX", symbol: "WAVAX" },
    priceNative: "0.00003109",
    priceUsd: "0.001071",
    txns: {
      m5: { buys: 0, sells: 0 },
      h1: { buys: 0, sells: 0 },
      h6: { buys: 1, sells: 0 },
      h24: { buys: 1, sells: 0 },
    },
    volume: { h24: 0, h6: 0, h1: 0, m5: 0 },
    priceChange: { m5: 0, h1: 0, h6: 0, h24: 0 },
    liquidity: { usd: 114396.4, base: 53360698, quote: 1659.02396 },
    fdv: 417075,
    pairCreatedAt: 1656684279000,
  }, // Last Updated: 2024-05-08
];

export const fetchPairDataOf = async (address: string) => {
  const resp = await fetch("https://api.dexscreener.io/latest/dex/tokens/" + address, {
    next: {
      revalidate: 3_600,
    },
  });
  let pairs = fallbackPairs;
  if (resp.ok) {
    const data: TokenResponse = await resp.json();
    if (data.pairs === null) {
      toast.error("Error finding pair");
      console.error("No matching DexScreener pairs for", address);
    } else {
      pairs = data.pairs;
    }
  } else {
    toast.error("Error fetching pair");
    console.error("Error fetching", address, "from DexScreener");
  }

  const pair = pairs
    .filter(p => p.chainId === "avalanche") // Avalanche chain
    .filter(p => p.baseToken.address === address) // Proper results
    .find(p => p.dexId === "traderjoe"); // Traded at TJ

  if (!pair) {
    throw new Error("Error finding pair");
  }
  return pair;
};

export const fetchPriceOf = async (address: Address) => {
  const pair = await fetchPairDataOf(address);
  return Number(pair.priceUsd);
};
