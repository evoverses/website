import { ClaimCEvoButton } from "@/app/(authenticated)/account/cevo-sheet";
import { getcEVOData } from "@/app/(authenticated)/account/fetch";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAccountCookie } from "@/lib/cookies/account";
import { formatEther } from "viem";

export const CEvoCard = async () => {
  const { address } = getAccountCookie();
  const data = await getcEVOData(address);

  const totalDisbursement = Number(formatEther(data.disbursements.reduce((a, c) => a + c.amount, 0n)));
  return (
    <Card>
      <CardHeader className="text-center">cEVO</CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-[300px] sm:w-[400px]">
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
                    {Math.floor((
                      Date.now() / 1000 - 1681860918
                    ) / 60 / 60 / 24)} / 365
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
                    {Math.floor((
                      Date.now() / 1000 - 1681860918
                    ) / 60 / 60 / 24)} / 365
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
      </CardContent>
    </Card>
  );
};
