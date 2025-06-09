"use client";
import { useEvo } from "@/hooks/use-evo";
import { EM_DASH } from "@/utils/strings";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@workspace/ui/components/accordion";
import { Table, TableBody, TableCell, TableRow } from "@workspace/ui/components/table";

const AssetStats = ({ tokenId }: { tokenId: string }) => {
  const { data, isFetching, isPlaceholderData, isLoading } = useEvo(tokenId);

  if (isFetching || isLoading || isPlaceholderData) {
    return (
      <AccordionItem value="stats">
        <AccordionTrigger>Stats</AccordionTrigger>
      </AccordionItem>
    );
  }

  if (!data) {
    throw new Error("No data");
  }

  const metadata = data.metadata;
  if (metadata.type === "EGG") {
    return null;
  }

  const stats = [
    { name: "Health", value: "50" },
    { name: "Attack", value: metadata.attack },
    { name: "Special", value: metadata.special },
    { name: "Defense", value: metadata.defense },
    { name: "Resistance", value: metadata.resistance },
    { name: "Speed", value: metadata.speed },
    {
      name: "Size",
      value: metadata.size > 0 ? `+${metadata.size}%` : metadata.size < 0 ? `${metadata.size}%` : EM_DASH,
    },
  ];
  return (
    <AccordionItem
      value="stats"
      className="data-[state=open]:[&>:nth-child(2)>:first-child]:pb-0 data-[state=open]:[&>:nth-child(2)>:first-child]:border-b-0"
    >
      <AccordionTrigger>Stats</AccordionTrigger>
      <AccordionContent>
        <Table className="[&_tr:nth-child(2n)]:bg-transparent">
          <TableBody>
            {stats.map(({ name, value }) => (
              <TableRow key={name}>
                <TableCell className="font-medium w-1/2">{name}</TableCell>
                <TableCell className="text-right">{value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AccordionContent>
    </AccordionItem>
  );
};
AssetStats.displayName = "AssetStats";

export { AssetStats };
