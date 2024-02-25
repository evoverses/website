import { IconProps } from "@radix-ui/react-icons/dist/types";
import { Address } from "abitype";
import { ForwardRefExoticComponent, RefAttributes } from "react";

export type Addressish = Address | string | undefined | null;

export interface Pool {
  name: string
  earned: bigint
  earnedUSD: number
  apr: number
  liquidity: number
  emissionRate: bigint
  level: bigint
  totalBalance: bigint
  totalBalanceUsd: number
  balance: bigint
  balanceUsd: number
  remainBalance: bigint
  remainBalanceUsd: number
  token0: string
  token1: string
  t0Symbol: string
  t1Symbol: string
  t0WalletBalance: bigint
  t1WalletBalance: bigint
  token0Balance: number
  token1Balance: number
  token0BalanceUSD: number
  token1BalanceUSD: number
  token0DivBalance: number
  token1DivBalance: number
  token0DivBalanceUSD: number
  token1DivBalanceUSD: number
  token: string
  lastTime: bigint
  depFee: bigint
  withdrawFee: number
  nextWithdrawFee: number
  nextSecondsRemaining: number
  value: number
  pid: bigint
  gas: bigint
}

export type Slug = "evo" | "egg";

export type RadixUIIcon = ForwardRefExoticComponent<IconProps & RefAttributes<SVGSVGElement>>;
