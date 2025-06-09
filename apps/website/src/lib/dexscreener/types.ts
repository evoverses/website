import type { Address } from "viem";

type DexScreenerToken = {
  address: string;
  name: string;
  symbol: string;
};

type DexScreenerPeriod = "m5" | "h1" | "h6" | "h24";

type DexScreenerPeriodTransactions = {
  buys: number;
  sells: number;
}

type Liquidity = {
  usd: number;
  base: number;
  quote: number;
};

type Info = {
  imageUrl: string;
  websites: {
    label: string
    url: string;
  }[];
  socials: {
    platform: string;
    handle: string;
  }[];
};

type Boosts = {
  active: number;
};

export type DexScreenerPair = {
  // Chain Name
  chainId: string;
  // Dex Name
  dexId: string;
  // DexScreener URL
  url: string;
  pairAddress: Address;
  labels: string[];
  baseToken: DexScreenerToken;
  quoteToken: DexScreenerToken;
  priceNative: string;
  priceUsd: string;
  txns: Partial<Record<DexScreenerPeriod, DexScreenerPeriodTransactions>>;
  volume: Partial<Record<DexScreenerPeriod, number>>;
  priceChange: Partial<Record<DexScreenerPeriod, number>>;
  liquidity: Liquidity;
  fdv: number;
  marketCap: number;
  pairCreatedAt: number;
  info: Info;
  boosts: Boosts;
};

export type WithDexScreenerPairs<T = unknown> = T & {
  pairs: DexScreenerPair[];
}
