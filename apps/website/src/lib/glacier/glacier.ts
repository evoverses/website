import { ERC20TokenBalance, ListERC20BalancesResponse, type ListERC721BalancesResponse } from "@/lib/glacier/types";
import { cache } from "react";
import { Address } from "thirdweb";

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
      chainId: "extensions",
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
  return data.erc20TokenBalances[0]!;
});

export const getOwnedNftIds = cache(async (contract: Address, wallet: Address) => {
  let nextPageToken: string | undefined = "";
  const nfts = [];
  while (nextPageToken !== undefined) {
    const resp = await listErc721(contract, wallet, nextPageToken);
    nextPageToken = resp.nextPageToken;
    nfts.push(...resp.erc721TokenBalances.filter(t => t.tokenId.length < 10));
  }
  return nfts.map(nft => Number(nft.tokenId));
});
const listErc721 = async (
  contract: Address,
  wallet: Address,
  pageToken: string | undefined = undefined,
): Promise<ListERC721BalancesResponse> => {
  const url = new URL(`addresses/${wallet}/balances:listErc721`, BASE_AVAX_URL);
  url.searchParams.set("pageSize", "100");
  url.searchParams.set("contractAddresses", contract);
  if (pageToken) {
    url.searchParams.set("pageToken", pageToken);
  }
  const resp = await fetch(url);

  if (!resp.ok) {
    console.error("Error fetching ERC721 balance", resp.status, await resp.text());
    return {
      erc721TokenBalances: [],
      nextPageToken: undefined,
    };
  }
  return resp.json();
};
