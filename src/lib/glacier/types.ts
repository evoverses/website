import { Address } from "abitype";

export type ERC20TokenBalance = {
  ercType: string,
  chainId: string,
  address: Address,
  name: string,
  symbol: string,
  decimals: number,
  price: {
    value: number,
    currencyCode: string
  },
  balance: string,
  balanceValue: {
    currencyCode: string,
    value: number
  }
}

export type ListERC20BalancesResponse = {
  erc20TokenBalances: ERC20TokenBalance[]
}
