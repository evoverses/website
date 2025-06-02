import { Address } from "thirdweb";

type ERCTokenBalance = {
  ercType: string;
  chainId: string;
  address: Address;
  name: string;
  symbol: string;
}

export type ERC20TokenBalance = ERCTokenBalance & {
  decimals: number;
  price: {
    value: number;
    currencyCode: string;
  }
  balance: string;
  balanceValue: {
    currencyCode: string;
    value: number;
  }
}

export type ListERC20BalancesResponse = {
  erc20TokenBalances: ERC20TokenBalance[]
}

export type ERC721TokenBalance = ERCTokenBalance & {
  tokenId: string;
  tokenUri: string;
  metadata: {
    indexStatus: string;
    metadataLastUpdatedTimestamp: number;
  }
  ownerAddress: Address;
}

export type ListERC721BalancesResponse = {
  erc721TokenBalances: ERC721TokenBalance[];
  nextPageToken?: string;
}
