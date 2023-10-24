import { getxEVOData } from "@/app/account/fetch";
import { XEvoSheet } from "@/app/account/xevo-sheets";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAccountCookie } from "@/lib/cookies/account";
import { bigIntJsonReplacer } from "@/lib/node";
import { formatEther } from "viem";

export const XEvoCard = async () => {
  const { address, loggedIn } = getAccountCookie();
  const data = await getxEVOData(address);
  console.log(data);
  const currentSharesRaw = data.xEvoUserBalance > 0 ? Number(data.xEvoUserBalance) / Number(data.xEvoTotalSupply) * 100 : 0;
  const currentShares = currentSharesRaw > 0 && Number(currentSharesRaw.toFixed(4)) === 0 ? "< 0.0001" : Number(currentSharesRaw.toFixed(4));
  const currentBalanceRaw = Number(formatEther(data.xEvoUserBalance));
  const currentBalance = currentBalanceRaw > 0 && Number(currentBalanceRaw.toFixed(4)) === 0 ? "< 0.0001" : Number(currentBalanceRaw.toFixed(4));
  return (
    <Card>
      <CardHeader className="text-center">xEVO</CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-[300px] sm:w-[400px]">
          <TabsList className="w-full">
            <TabsTrigger value="overview" className="w-full">Overview</TabsTrigger>
            <TabsTrigger value="account" className="w-full">Account</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <Table>
              <TableCaption>xEVO is your bank holdings. The amount of EVO will increase proportional to the xEVO
                multiplier.</TableCaption>
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
              <TableCaption>xEVO is your bank holdings. The amount of EVO will increase proportional to the xEVO
                multiplier.</TableCaption>
              <TableBody>
                <TableRow>
                  <TableCell>Multiplier</TableCell>
                  <TableCell>{Number(data.multiplier)}x</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Current Balance</TableCell>
                  <TableCell>{currentBalance} xEVO</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Available To Deposit</TableCell>
                  <TableCell>{Number(formatEther(data.evoUserBalance)).toLocaleString()} EVO</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Current Share %</TableCell>
                  <TableCell>{currentShares}%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <div className="flex pt-2 space-x-2">
              <XEvoSheet
                action="Deposit"
                json={JSON.stringify(data, bigIntJsonReplacer)}
                disabled={!loggedIn || Number(data.evoUserBalance) === 0}
              />
              <XEvoSheet
                action="Withdraw"
                json={JSON.stringify(data, bigIntJsonReplacer)}
                disabled={!loggedIn || Number(data.xEvoUserBalance) === 0}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
