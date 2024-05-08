import { SnowtraceLink } from "@/components/buttons/snowtrace-link-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getEvoHistory } from "@/lib/subsquid";

type EventsProps = {
  slug: string;
  tokenId: string;
}

export const AssetHistory = async ({ slug, tokenId }: EventsProps) => {
  const history = await getEvoHistory(tokenId);
  if (!history) {
    return null;
  }
  return (
    <Table className="overflow-x-scroll">
      <TableHeader>
        <TableRow>
          <TableHead className="w-[160px]">Date</TableHead>
          <TableHead className="w-[90px]">Block</TableHead>
          <TableHead className="w-[160px]">TX Hash</TableHead>
          <TableHead>From</TableHead>
          <TableHead>To</TableHead>
          <TableHead className="text-right">Type</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {history.transfers.map(t => (
          <TableRow key={t.id}>
            <TableCell className="font-medium text-nowrap">{new Date(Date.parse(t.timestamp)).toLocaleString()}</TableCell>
            <TableCell>{t.block.toLocaleString()}</TableCell>
            <TableCell>
              <SnowtraceLink type="tx" bytes={t.txHash} />
            </TableCell>
            <TableCell>
              <SnowtraceLink bytes={t.from} />
            </TableCell>
            <TableCell>
              <SnowtraceLink bytes={t.to} />
            </TableCell>
            <TableCell className="text-right">
              {BigInt(t.from) === 0n ? "Mint" : BigInt(t.to) === 0n ? "Burn" : "Transfer"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
