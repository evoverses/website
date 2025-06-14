"use client";

import { getcEVOData, getEVOData, getPoolData, getxEVOData } from "@/app/profile/_components/fetch";
import { ClaimCEvoButton } from "@/app/profile/liquidity/buttons";
import { BankSmartDrawer, FarmSmartDrawer, RevokeSmartDrawer } from "@/app/profile/liquidity/smart-drawers";
import { AddToWalletButton } from "@/components/buttons/add-to-wallet-button";
import { cEvoContract, evoContract, investorContract, xEvoContract } from "@/data/contracts";
import { useEvoPrice } from "@/hooks/use-token-price";
import { chain, client } from "@/lib/thirdweb/config";
import { cap } from "@/lib/thirdweb/extensions/0x42006ab57701251b580bdfc24778c43c9ff589a1";
import { totalBurned } from "@/lib/thirdweb/extensions/0x7b5501109c2605834f7a4153a75850db7521c37e";
import { bigIntJsonReplacer } from "@/utils/node";
import { staleTimeMinutes } from "@/utils/numbers";
import { formatUsd } from "@workspace/evoverses/utils/numbers";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card";
import { Table, TableBody, TableCaption, TableCell, TableRow } from "@workspace/ui/components/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { cn } from "@workspace/ui/lib/utils";
import Link from "next/link";
import { ComponentProps, type PropsWithChildren } from "react";
import { getContract } from "thirdweb";
import { balanceOf, totalSupply } from "thirdweb/extensions/erc20";
import { AccountBalance, AccountProvider, useActiveAccount } from "thirdweb/react";
import { type Address, formatEther, zeroAddress } from "viem";

type CardBaseProps = {
  title: string;
  revoke?: ComponentProps<typeof RevokeSmartDrawer>;
  token?: ComponentProps<typeof AddToWalletButton>
  className?: string;
};

export const CardBase = ({ title, token, revoke, className, children }: PropsWithChildren<CardBaseProps>) => {
  return (
    <Card>
      <CardHeader className="text-center relative">
        <div className="text-center relative">
          {revoke && <RevokeSmartDrawer {...revoke} className="absolute left-1" />}
          {title}
          {token && <AddToWalletButton {...token} className="absolute right-1" />}
        </div>
      </CardHeader>
      <CardContent className={cn("flex flex-col flex-1", className)}>
        {children}
      </CardContent>
    </Card>
  );
};

const EvoCard = () => {
  const account = useActiveAccount();
  const price = useEvoPrice();
  const data = useQueries({
    queries: [
      {
        queryKey: [ "evo-total-supply" ],
        queryFn: () => totalSupply({ contract: evoContract }),
        placeholderData: 0n,
        staleTime: staleTimeMinutes(1_440),
      },
      {
        queryKey: [ "evo-balance", account?.address ],
        queryFn: () => balanceOf({ contract: evoContract, address: account?.address || "" }),
        placeholderData: 0n,
        enabled: !!account?.address,
        staleTime: staleTimeMinutes(5),
      },
      {
        queryKey: [ "evo-locked" ],
        queryFn: () => balanceOf({ contract: evoContract, address: cEvoContract.address }),
        placeholderData: 0n,
        staleTime: staleTimeMinutes(1_440),
      },
      {
        queryKey: [ "evo-burned" ],
        queryFn: () => totalBurned({ contract: evoContract }),
        placeholderData: 0n,
        staleTime: staleTimeMinutes(1_440),
      },
      {
        queryKey: [ "evo-cap" ],
        queryFn: () => cap({ contract: evoContract }),
        placeholderData: 0n,
        staleTime: staleTimeMinutes(1_440),
      },
    ],
    combine: result => {
      const combined = {
        totalSupply: result[0].data || 0n,
        balance: result[1].data || 0n,
        locked: result[2].data || 0n,
        burned: result[3].data || 0n,
        cap: result[4].data || 0n,
      };
      return {
        ...combined,
        circulating: combined.totalSupply - combined.burned - combined.locked,
      };
    },
  });
  const fmtEvo = (n: bigint) => Number(formatEther(n)).toLocaleString("en", { maximumFractionDigits: 0 }) + " EVO";
  const rows = [
    { name: "FDV", value: formatUsd(price * Number(formatEther(data.cap))) + " USD" },
    { name: "Market Cap", value: formatUsd(price * Number(formatEther(data.totalSupply))) + " USD" },
    { name: "Current Price", value: formatUsd(price, { minimumFractionDigits: 3, maximumFractionDigits: 8 }) + " USD" },
    { name: "Total Capacity", value: fmtEvo(data.cap) },
    { name: "Total Supply", value: fmtEvo(data.totalSupply) },
    { name: "Total Burned", value: fmtEvo(data.burned) },
    { name: "Total Locked", value: fmtEvo(data.locked) },
    { name: "Circulating Supply", value: fmtEvo(data.circulating) },
  ];
  return (
    <CardBase
      title="EVO"
      token={{ address: evoContract.address, image: "https://evoverses.com/EVO.png", symbol: "EVO" }}
      className="pb-4"
    >
      <Table className="w-75 sm:w-100">
        <TableBody>
          {rows.map(({ name, value }, i) => (
            <TableRow key={name} className={cn({ "border-b-black dark:border-b-white border-b": i === 2 })}>
              <TableCell>{name}</TableCell>
              <TableCell className="text-right">{value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardBase>
  );
};
EvoCard.displayName = "EvoCard";

const FarmCard = () => {
  const account = useActiveAccount();
  const { data: pool, isFetching, isPlaceholderData, isLoading } = useQuery({
    queryKey: [ "farm-pools", account?.address ],
    queryFn: async () => {
      const pools = await getPoolData(account?.address as Address || zeroAddress);
      return pools[0];
    },
    staleTime: staleTimeMinutes(10),
  });
  if (isFetching || isPlaceholderData || isLoading) {
    return null;
  }
  if (!pool) {
    return null;
  }
  return (
    <CardBase
      title={pool.name}
      token={{ address: pool.token, symbol: pool.name }}
      revoke={{ contract: getContract({ client, chain, address: pool.token }), spender: investorContract.address }}
    >
      <Tabs
        defaultValue="overview"
        className="flex-1 w-75 sm:w-100 [&_div[data-slot=table-container]]:overflow-hidden!"
      >
        <TabsList className="w-full">
          <TabsTrigger value="overview" className="w-full">Overview</TabsTrigger>
          <TabsTrigger value="account" className="w-full">Account</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <Table>
            <TableCaption>* The APR is calculated using a simplified formula and might not fully represent the
              exact APR.</TableCaption>
            <TableBody>
              <TableRow>
                <TableCell>APR*</TableCell>
                <TableCell>{pool.apr}%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Total Deposited</TableCell>
                <TableCell>${pool.totalBalanceUsd.toLocaleString()} USD</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Reward Allocation</TableCell>
                <TableCell>{pool.level.toString()}%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Emission Rate</TableCell>
                <TableCell>{formatEther(pool.emissionRate)} EVO / second</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <Link href={`https://traderjoexyz.com/avalanche/pool/v1/${pool.token0}/AVAX`} target="_blank">
            <Button className="w-full mt-2 font-bold">
              Add Liquidity
            </Button>
          </Link>
        </TabsContent>
        <TabsContent value="account">
          <Table>
            <TableCaption>When you deposit or withdraw, accrued EVO is claimed automatically.</TableCaption>
            <TableBody>
              <TableRow>
                <TableCell>Deposited</TableCell>
                <TableCell>
                  {pool.balance > 0
                    ? Number(pool.balance) / 1e18 < 0.001
                      ? "< 0.001"
                      : (
                        Number(pool.balance) / 1e18
                      ).toLocaleString()
                    : "0"} LP
                </TableCell>
                <TableCell>
                  {pool.balanceUsd > 0
                    ? pool.balanceUsd < 0.01
                      ? "< $0.01"
                      : `$${pool.remainBalanceUsd.toLocaleString()}`
                    : "0"} USD
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{pool.t0Symbol}</TableCell>
                <TableCell>
                  {pool.token0DivBalance > 0
                    ? Number(pool.token0DivBalance) / 1e18 < 0.001
                      ? "< 0.001"
                      : (
                        Number(pool.token0DivBalance) / 1e18
                      ).toLocaleString()
                    : "0"} {pool.t0Symbol}
                </TableCell>
                <TableCell>
                  {pool.token0DivBalanceUSD > 0
                    ? pool.token0DivBalanceUSD < 0.01
                      ? "< $0.01"
                      : `$${pool.token0DivBalanceUSD.toLocaleString()}`
                    : "0"} USD
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{pool.t1Symbol}</TableCell>
                <TableCell>
                  {pool.token1DivBalance > 0
                    ? Number(pool.token1DivBalance) / 1e18 < 0.001
                      ? "< 0.001"
                      : (
                        Number(pool.token1DivBalance) / 1e18
                      ).toLocaleString()
                    : "0"} {pool.t1Symbol}
                </TableCell>
                <TableCell>
                  {pool.token1DivBalanceUSD > 0
                    ? pool.token1DivBalanceUSD < 0.01
                      ? "< $0.01"
                      : `$${pool.token1DivBalanceUSD.toLocaleString()}`
                    : "0"} USD
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Unclaimed Rewards</TableCell>
                <TableCell>
                  {pool.earned > 0
                    ? Number(pool.earned) / 1e18 < 0.001
                      ? "< 0.001"
                      : (
                        Number(pool.earned) / 1e18
                      ).toLocaleString()
                    : "0"} EVO
                </TableCell>
                <TableCell>
                  {pool.earnedUSD > 0
                    ? pool.earnedUSD < 0.01
                      ? "< $0.01"
                      : `$${pool.earnedUSD.toLocaleString()}`
                    : "0"} USD</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <div className="flex pt-2 space-x-2">
            <FarmSmartDrawer
              action="Claim"
              poolJson={JSON.stringify(pool, bigIntJsonReplacer)}
              disabled={Number(pool.earned) === 0}
              className="flex-1"
            />
            <FarmSmartDrawer
              action="Deposit"
              poolJson={JSON.stringify(pool, bigIntJsonReplacer)}
              disabled={Number(pool.remainBalance) === 0}
              className="flex-1"
            />
            <FarmSmartDrawer
              action="Withdraw"
              poolJson={JSON.stringify(pool, bigIntJsonReplacer)}
              disabled={Number(pool.balance) === 0}
              className="flex-1"
            />
          </div>
        </TabsContent>
      </Tabs>
    </CardBase>
  );
};
FarmCard.displayName = "FarmCard";

const BankCard = () => {
  const account = useActiveAccount();
  const { data, isFetching, isPlaceholderData, isLoading } = useQuery({
    queryKey: [ "bank", account?.address ],
    queryFn: async () => getxEVOData(account?.address as Address || zeroAddress),
    staleTime: staleTimeMinutes(10),
  });
  if (isFetching || isPlaceholderData || isLoading) {
    return null;
  }
  if (!data) {
    return null;
  }

  const currentSharesRaw = data.xEvoUserBalance > 0
    ? Number(data.xEvoUserBalance) / Number(data.xEvoTotalSupply) * 100
    : 0;
  const currentShares = currentSharesRaw > 0 && Number(currentSharesRaw.toFixed(4)) === 0 ? "< 0.0001" : Number(
    currentSharesRaw.toFixed(4));

  return (
    <CardBase
      title="xEVO"
      token={{ address: xEvoContract.address, image: "https://evoverses.com/EVO.png", symbol: "xEVO" }}
      revoke={{
        contract: evoContract,
        spender: xEvoContract.address,
      }}
    >
      <Tabs defaultValue="overview" className="w-75 sm:w-100  [&_div[data-slot=table-container]]:overflow-hidden!">
        <TabsList className="w-full">
          <TabsTrigger value="overview" className="w-full">Overview</TabsTrigger>
          <TabsTrigger value="account" className="w-full">Account</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <Table>
            <TableCaption>
              xEVO is your bank holdings. The amount of EVO will increase proportional to the xEVO multiplier.
            </TableCaption>
            <TableBody>
              <TableRow>
                <TableCell>Multiplier</TableCell>
                <TableCell>{Number(data.multiplier)}x</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Total Deposited</TableCell>
                <TableCell>{Number(formatEther(data.xEvoEvoBalance)).toLocaleString()} EVO</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Circulating Supply</TableCell>
                <TableCell>{Number(formatEther(data.xEvoTotalSupply)).toLocaleString()} xEVO</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>TVL</TableCell>
                <TableCell>{data.tvl.toLocaleString()} USD</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TabsContent>
        <TabsContent value="account">
          <Table>
            <AccountProvider address={account?.address || zeroAddress} client={client}>
              <TableCaption>
                xEVO is your bank holdings. The amount of EVO will increase proportional to the xEVO multiplier.
              </TableCaption>
              <TableBody>
                <TableRow>
                  <TableCell>Multiplier</TableCell>
                  <TableCell>{Number(data.multiplier)}x</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Current Balance</TableCell>
                  <TableCell>
                    <AccountBalance chain={chain} tokenAddress={xEvoContract.address} />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Available To Deposit</TableCell>
                  <TableCell>
                    <AccountBalance chain={chain} tokenAddress={evoContract.address} />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Current Share %</TableCell>
                  <TableCell>{currentShares}%</TableCell>
                </TableRow>
              </TableBody>
            </AccountProvider>
          </Table>
          <div className="flex pt-2 space-x-2">
            <BankSmartDrawer
              action="Deposit"
              json={JSON.stringify(data, bigIntJsonReplacer)}
              disabled={Number(data.evoUserBalance) === 0}
              className="flex-1"
            />
            <BankSmartDrawer
              action="Withdraw"
              json={JSON.stringify(data, bigIntJsonReplacer)}
              disabled={Number(data.xEvoUserBalance) === 0}
              className="flex-1"
            />
          </div>
        </TabsContent>
      </Tabs>
    </CardBase>
  );
};
BankCard.displayName = "BankCard";

const VestingCard = () => {
  const account = useActiveAccount();
  const { data, evoData, isFetching, isLoading } = useQueries({
    queries: [
      {
        queryKey: [ "cevo-data", account?.address ],
        queryFn: () => getcEVOData(account?.address as Address || zeroAddress),
      },
      {
        queryKey: [ "evo-data", account?.address ],
        queryFn: () => getEVOData(account?.address as Address || zeroAddress),
      },
    ],
    combine: result => {
      return {
        data: result[0].data || null,
        evoData: result[1].data || null,
        isLoading: result[0].isLoading || result[1].isLoading,
        isFetching: result[0].isFetching || result[1].isFetching,
      };
    },
  });
  if (isFetching || isLoading) {
    return null;
  }
  if (!data || !evoData) {
    return null;
  }

  const totalDisbursement = Number(formatEther(data.disbursements.reduce((a, c) => a + c.amount, 0n)));
  return (
    <CardBase
      title="cEVO"
      token={{ address: cEvoContract.address as Address, image: "https://evoverses.com/EVO.png", symbol: "cEVO" }}
    >
      <Tabs defaultValue="overview" className="w-75 sm:w-100 [&_div[data-slot=table-container]]:overflow-hidden!">
        <TabsList className="w-full">
          <TabsTrigger value="overview" className="w-full">Overview</TabsTrigger>
          <TabsTrigger value="account" className="w-full">Account</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <Table>
            <TableCaption>
              Multipurpose vesting token. cEVO vests linearly over 1 year. cEVO vests into EVO.
            </TableCaption>
            <TableBody>
              <TableRow>
                <TableCell className="flex flex-col">
                  <span>Days Elapsed</span>
                  <span>(Contract Reward)</span>
                </TableCell>
                <TableCell>273 / 273</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="flex flex-col">
                  <span>Days Elapsed</span>
                  <span>(LP Rewards)</span>
                </TableCell>
                <TableCell>
                  365 / 365
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="flex flex-col">
                  <span>Unclaimed</span>
                  <span>(Global)</span>
                </TableCell>
                <TableCell>
                  {Number(Number(formatEther(evoData.locked)).toFixed(3)).toLocaleString()} EVO
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TabsContent>
        <TabsContent value="account">
          <Table>
            <TableCaption>
              Multipurpose vesting token. cEVO vests linearly over 1 year. cEVO vests into EVO.
            </TableCaption>
            <TableBody>
              <TableRow>
                <TableCell>Days Elapsed</TableCell>
                <TableCell>
                  365 / 365
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Disbursement</TableCell>
                <TableCell>{totalDisbursement.toLocaleString()} cEVO</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Claimed</TableCell>
                <TableCell>
                  {(
                    totalDisbursement - Number(formatEther(data.balance))
                  ).toLocaleString()} EVO
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Vested</TableCell>
                <TableCell>{Number(formatEther(data.pending)).toLocaleString()} cEVO</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <div className="flex pt-2 space-x-2">
            <ClaimCEvoButton disabled={Number(formatEther(data.pending)) === 0} />
          </div>
        </TabsContent>
      </Tabs>
    </CardBase>
  );
};

export { EvoCard, FarmCard, BankCard, VestingCard };
