import { getcEVOData, getEVOData, getPoolData, getxEVOData } from "@/app/profile/_components/fetch";
import { ClaimCEvoButton } from "@/app/profile/liquidity/buttons";
import {
  BankSmartDrawer,
  FarmSmartDrawer,
  RevokeSmartDrawer,
} from "@/app/profile/liquidity/smart-drawers";
import { AddToWalletButton } from "@/components/buttons/add-to-wallet-button";
import { cEvoContract, evoContract, investorContract, xEvoContract } from "@/data/contracts";

import { getAccountCookie } from "@/lib/cookies/account.server";
import { fetchPriceOf } from "@/lib/dexscreener/actions";

import { bigIntJsonReplacer } from "@/utils/node";
import { cn } from "@/lib/utils";
import { chain, client } from "@/lib/thirdweb/config";
import { formatUsd } from "@workspace/evoverses/utils/numbers";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card";
import { Table, TableBody, TableCaption, TableCell, TableRow } from "@workspace/ui/components/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import Link from "next/link";
import { ComponentProps, type PropsWithChildren } from "react";
import { type Address, getContract } from "thirdweb";
import { AccountBalance, AccountProvider } from "thirdweb/react";
import { formatEther } from "viem";

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
      <CardContent className={cn(className)}>
        {children}
      </CardContent>
    </Card>
  );
};

const VestingCard = async () => {
  const { address } = await getAccountCookie();
  const [ data, evoData ] = await Promise.all([ getcEVOData(address), getEVOData(address) ]);

  const totalDisbursement = Number(formatEther(data.disbursements.reduce((a, c) => a + c.amount, 0n)));
  return (
    <CardBase
      title="cEVO"
      token={{ address: cEvoContract.address as Address, image: "https://evoverses.com/EVO.png", symbol: "cEVO" }}
    >
      <Tabs defaultValue="overview" className="w-75 sm:w-100">
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

const BankCard = async () => {
  const { address } = await getAccountCookie();
  const data = await getxEVOData(address);
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
      <Tabs defaultValue="overview" className="w-75 sm:w-100">
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
            <AccountProvider address={address} client={client}>
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
            />
            <BankSmartDrawer
              action="Withdraw"
              json={JSON.stringify(data, bigIntJsonReplacer)}
              disabled={Number(data.xEvoUserBalance) === 0}
            />
          </div>
        </TabsContent>
      </Tabs>
    </CardBase>
  );
};

const FarmCard = async () => {
  const { address } = await getAccountCookie();
  const pools = await getPoolData(address);
  const pool = pools[0]!;
  const contract = getContract({ client, chain, address: pool.token });
  return (
    <CardBase
      title={pool.name}
      token={{ address: pool.token, symbol: pool.name }}
      revoke={{ contract, spender: investorContract.address }}
    >
      <Tabs defaultValue="overview" className="w-75 sm:w-100">
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
            />
            <FarmSmartDrawer
              action="Deposit"
              poolJson={JSON.stringify(pool, bigIntJsonReplacer)}
              disabled={Number(pool.remainBalance) === 0}
            />
            <FarmSmartDrawer
              action="Withdraw"
              poolJson={JSON.stringify(pool, bigIntJsonReplacer)}
              disabled={Number(pool.balance) === 0}
            />
          </div>
        </TabsContent>
      </Tabs>
    </CardBase>
  );
};

export { BankCard, FarmCard, VestingCard };
