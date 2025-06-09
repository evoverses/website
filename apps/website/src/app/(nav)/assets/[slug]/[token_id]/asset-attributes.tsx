"use client";
import { useEvo } from "@/hooks/use-evo";
import { hasTypes, isEggMetadata } from "@/lib/evo/utils";
import type { SquidAssetMetadata } from "@/lib/squid/types";
import { EM_DASH } from "@/utils/strings";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@workspace/ui/components/accordion";
import { Table, TableBody, TableCell, TableRow } from "@workspace/ui/components/table";

const AssetAttributes = ({ tokenId }: { tokenId: string }) => {
  const { data, isFetching, isPlaceholderData, isLoading } = useEvo(tokenId);

  if (isFetching || isLoading || isPlaceholderData) {
    return (
      <AccordionItem value="attributes">
        <AccordionTrigger>Attributes</AccordionTrigger>
      </AccordionItem>
    );
  }
  if (!data) {
    throw new Error("No data");
  }

  const metadata = data.metadata as SquidAssetMetadata;
  const isEgg = isEggMetadata(metadata);
  const attributes = [
    isEgg ? undefined : { name: "Gender", value: metadata.gender },
    { name: "Species", value: metadata.species },
    isEgg ? undefined : { name: "Nature", value: metadata.nature },
    hasTypes(metadata) ? { name: "Primary Type", value: metadata.primaryType } : undefined,
    hasTypes(metadata) ? {
      name: "Secondary Type",
      value: metadata.secondaryType === "None" ? EM_DASH : metadata.secondaryType,
    } : undefined,
    isEgg ? undefined : { name: "Rarity", value: metadata.rarity },
    isEgg ? undefined : { name: "Chroma", value: metadata.chroma },
    isEgg ? { name: "Treated", value: metadata.treated ? "True" : "False" } : undefined,
    { name: "Level", value: "1" },
  ].filter(v => v !== undefined);

  return (
    <AccordionItem
      value="attributes"
      className="data-[state=open]:[&>:nth-child(2)>:first-child]:pb-0 data-[state=open]:[&>:nth-child(2)>:first-child]:border-b-0"
    >
      <AccordionTrigger>Attributes</AccordionTrigger>
      <AccordionContent>
        <Table className="[&_tr:nth-child(2n)]:bg-transparent">
          <TableBody>
            {attributes.map(({ name, value }) => (
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
AssetAttributes.displayName = "AssetAttributes";

export { AssetAttributes };
