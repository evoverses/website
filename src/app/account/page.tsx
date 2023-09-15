import { getPoolData } from "@/app/account/fetch";
import FarmSheet from "@/app/account/sheets";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAccountCookie } from "@/lib/cookies/account";
import { bigIntJsonReplacer } from "@/lib/node";
import Link from "next/link";
import { formatEther } from "viem";

const AccountPage = async () => {
  const { address, loggedIn } = getAccountCookie();
  const pools = await getPoolData(address);

  return (
    <main className="flex min-h-screen flex-col items-center justify-around p-24 pb-4 px-4 sm:px-24">
      {pools.map((pool, i) => (
        <Card key={i}>
          <CardHeader className="text-center">{pool.name}</CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-[300px] sm:w-[400px]">
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
                        {pool.balance > 0 && Number(pool.balance) / 1e18 < 0.001
                          ? "< 0.001"
                          : (Number(pool.balance) / 1e18).toLocaleString()} LP
                      </TableCell>
                      <TableCell>
                        {pool.balanceUsd > 0 && pool.balanceUsd < 0.01
                          ? "< $0.01"
                          : `$${pool.remainBalanceUsd.toLocaleString()}`} USD
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>{pool.t0Symbol}</TableCell>
                      <TableCell>
                        {pool.token0Balance > 0 && Number(pool.token0Balance) / 1e18 < 0.001
                          ? "< 0.001"
                          : (Number(pool.token0Balance) / 1e18).toLocaleString()} {pool.t0Symbol}
                      </TableCell>
                      <TableCell>
                        {pool.token0BalanceUSD > 0 && pool.token0BalanceUSD < 0.01
                          ? "< $0.01"
                          : `$${pool.token0BalanceUSD.toLocaleString()}`} USD
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>{pool.t1Symbol}</TableCell>
                      <TableCell>
                        {pool.token1Balance > 0 && Number(pool.token1Balance) / 1e18 < 0.001
                          ? "< 0.001"
                          : (
                            Number(pool.token1Balance) / 1e18
                          ).toLocaleString()} {pool.t1Symbol}
                      </TableCell>
                      <TableCell>
                        {pool.token1BalanceUSD > 0 && pool.token1BalanceUSD < 0.01
                          ? "< $0.01"
                          : `$${pool.token1BalanceUSD.toLocaleString()}`} USD
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Unclaimed Rewards</TableCell>
                      <TableCell>
                        {pool.earned > 0 && Number(pool.earned) / 1e18 < 0.001
                          ? "< 0.001"
                          : (
                            Number(pool.earned) / 1e18
                          ).toLocaleString()} EVO
                      </TableCell>
                      <TableCell>
                        {pool.earnedUSD > 0 && pool.earnedUSD < 0.01
                          ? "< $0.01"
                          : `$${pool.earnedUSD.toLocaleString()}`} USD</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                <div className="flex pt-2 space-x-2">
                  <FarmSheet
                    action="Claim"
                    poolJson={JSON.stringify(pool, bigIntJsonReplacer)}
                    disabled={!loggedIn || Number(pool.earned) === 0}
                  />
                  <FarmSheet
                    action="Deposit"
                    poolJson={JSON.stringify(pool, bigIntJsonReplacer)}
                    disabled={!loggedIn || Number(pool.remainBalance) === 0}
                  />
                  <FarmSheet
                    action="Withdraw"
                    poolJson={JSON.stringify(pool, bigIntJsonReplacer)}
                    disabled={!loggedIn || Number(pool.balance) === 0}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>

        </Card>
      ))}
    </main>
  );
};

export default AccountPage;
