import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getEvoHistory } from "@/lib/subsquid";
import { ExternalLinkIcon } from "@radix-ui/react-icons";
import Link from "next/link";

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

export const SnowtraceLink = ({ bytes, type = "address" }: { bytes: string, type?: "tx" | "address" }) => (
  <Link
    href={`https://43114.snowtrace.io/${type}/${bytes}`}
    prefetch={false}
    target="_blank"
    rel="nofollow noreferrer"
    className="flex items-center"
  >
    {bytes.slice(0, type === "tx" ? 6 : 8)}...{bytes.slice(type === "tx" ? -6 : -4)}
    <ExternalLinkIcon className="inline-block w-4 h-4 ml-1" />
  </Link>
);
