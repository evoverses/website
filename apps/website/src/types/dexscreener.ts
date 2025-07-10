export interface TokenResponse {
  schemaVersion: string
  pairs: Pair[] | null;
}

export interface Pair {
  chainId: string
  dexId: string
  url: string
  pairAddress: string
  baseToken: BaseToken
  quoteToken: QuoteToken
  priceNative: string
  priceUsd: string
  txns: Txns
  volume: Volume
  priceChange: PriceChange
  liquidity: Liquidity
  fdv: number
  pairCreatedAt: number
}

export interface BaseToken {
  address: string
  name: string
  symbol: string
}

export interface QuoteToken {
  address: string
  name: string
  symbol: string
}

export interface Txns {
  m5: M5
  h1: H1
  h6: H6
  h24: H24
}

export interface M5 {
  buys: number
  sells: number
}

export interface H1 {
  buys: number
  sells: number
}

export interface H6 {
  buys: number
  sells: number
}

export interface H24 {
  buys: number
  sells: number
}

export interface Volume {
  h24: number
  h6: number
  h1: number
  m5: number
}

export interface PriceChange {
  m5: number
  h1: number
  h6: number
  h24: number
}

export interface Liquidity {
  usd: number
  base: number
  quote: number
}
