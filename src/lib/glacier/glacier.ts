import { ERC20TokenBalance, ListERC20BalancesResponse } from "@/lib/glacier/types";
import { Address } from "abitype";
import { cache } from "react";

const BASE_URL = new URL("https://glacier-api.avax.network/v1/");
const BASE_AVAX_URL = new URL("chains/43114/", BASE_URL);

export const getERC20Balance = cache(async (contractAddress: Address, wallet: Address): Promise<ERC20TokenBalance> => {
  const url = new URL(`addresses/${wallet}/balances:listErc20`, BASE_AVAX_URL);
  url.searchParams.set("pageSize", "1");
  url.searchParams.set("contractAddresses", contractAddress);
  const resp = await fetch(url);

  if (!resp.ok) {
    console.error("Error fetching ERC20 balance", resp.status, await resp.text());
    return {
      ercType: "ERC-20",
      chainId: "43114",
      address: contractAddress,
      name: "Unknown",
      symbol: "Unknown",
      decimals: 18,
      price: {
        value: 0,
        currencyCode: "usd",
      },
      balance: "0",
      balanceValue: {
        currencyCode: "usd",
        value: 0,
      },
    };
  }
  const data = await resp.json() as ListERC20BalancesResponse;
  return data.erc20TokenBalances[0];
});
