// noinspection JSUnusedGlobalSymbols

import { evoContractAddress, wavaxContractAddress } from "@/data/addresses";
import { fetchDexScreenerPoolsOfToken } from "@/lib/dexscreener/actions";
import type { DexScreenerPair } from "@/lib/dexscreener/types";
import { chain } from "@/lib/thirdweb/config";
import { useQuery } from "@tanstack/react-query";
import { NATIVE_TOKEN_ADDRESS } from "thirdweb";
import type { Arrayable } from "type-fest";
import { type Address, zeroAddress } from "viem";

export type UseTokenPriceOpts = {
  enabled?: boolean
}

export const useTokenPrices = ({ chainId, address }: {
  chainId: number | string,
  address: Arrayable<Address>
}, opts: UseTokenPriceOpts = { enabled: true }) => {
  const addressesArray = Array.isArray(address) ? address.map(a => a.toLowerCase()) : [ address.toLowerCase() ];
  const wrappedAddress = wavaxContractAddress.toLowerCase();
  const addresses = addressesArray.map(a => (
    a === NATIVE_TOKEN_ADDRESS || a === zeroAddress
  ) ? wrappedAddress : a);
  const placeholderData = addresses.reduce((v, a) => (
    { ...v, [a.toLowerCase()]: 0 }
  ), {} as Record<Address, number>);

  const { data } = useQuery({
    queryKey: [ "dexscreener-token-price", String(chainId), ...addresses ],
    queryFn: async () => {
      const pairs = await fetchDexScreenerPoolsOfToken(chainId, addresses);
      const values = addresses.reduce((v, a) => {
        const baseTokenPairs = pairs.filter(p => p.baseToken.address.toLowerCase() === a.toLowerCase());
        const quoteTokenPairs = pairs.filter(p => p.quoteToken.address.toLowerCase() === a.toLowerCase());
        const pairGroups = (
          baseTokenPairs.length > 0 ? baseTokenPairs : quoteTokenPairs
        );
        const pair = pairGroups
          .reduce((v, p) => {
            if (Object.keys(v).length === 0) {
              return p;
            }
            return p.liquidity.usd > v.liquidity.usd ? p : v;
          }, {} as DexScreenerPair);
        v[a.toLowerCase() as Address] = pair?.priceUsd ? Number(pair.priceUsd) : 0;
        return v;
      }, {} as Record<Address, number>);
      values[NATIVE_TOKEN_ADDRESS] = values[wrappedAddress.toLowerCase() as Address] || 0;
      values[zeroAddress] = values[wrappedAddress.toLowerCase() as Address] || 0;
      return values;
    },
    enabled: addresses.length > 0 && !!chainId && opts.enabled,
    staleTime: 1_000 * 60 * 30,
    placeholderData,
  });
  return {
    data: data || placeholderData,
  };
};

export const useTokenPrice = (
  chainId: number | string,
  address: Address,
  opts: UseTokenPriceOpts = { enabled: true },
) => {
  const { data } = useTokenPrices({ chainId, address }, opts);
  const addr = (
    address.toLowerCase() === NATIVE_TOKEN_ADDRESS || address.toLowerCase() === zeroAddress
  )
    ? wavaxContractAddress.toLowerCase()
    : address.toLowerCase();
  if (!opts.enabled) {
    return 0;
  }
  return data[addr as Address] || 0;
};

export const useEvoPrice = (opts: UseTokenPriceOpts = { enabled: true }) => {
  const { data } = useTokenPrices({ chainId: chain.id, address: evoContractAddress }, opts);
  if (!opts.enabled) {
    return 0;
  }
  return data[evoContractAddress.toLowerCase() as Address] || 0;
};

export const useNativePrice = (chainId: number | string = chain.id) => {
  const address = wavaxContractAddress;
  const { data } = useTokenPrices({ chainId, address });
  return data[address.toLowerCase() as Address] || 0;
};
