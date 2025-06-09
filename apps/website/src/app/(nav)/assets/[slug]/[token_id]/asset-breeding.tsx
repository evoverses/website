"use client";
import { useEvo } from "@/hooks/use-evo";
import { secondsSince } from "@/utils/numbers";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@workspace/ui/components/accordion";
import { Table, TableBody, TableCell, TableRow } from "@workspace/ui/components/table";

const breedBaseCost = 250;

const AssetBreeding = ({ tokenId }: { tokenId: string }) => {
  const { data, isFetching, isPlaceholderData, isLoading } = useEvo(tokenId);

  if (isFetching || isLoading || isPlaceholderData) {
    return (
      <AccordionItem value="breeding">
        <AccordionTrigger>Breeding</AccordionTrigger>
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

  const genBreedBaseCost = breedBaseCost * 2 ** metadata.generation;
  const breedCost = metadata.generation === 0 && metadata.totalBreeds >= 5 ? 2_500 : genBreedBaseCost
    + genBreedBaseCost
    * metadata.totalBreeds;
  const attributes = [
    { name: "Total Breeds", value: `${metadata.totalBreeds} / ${metadata.generation === 0 ? "∞" : 5}` },
    { name: "Next Breed Cost", value: breedCost.toLocaleString("en") + " EVO" },
    { name: "Last Breed Time", value: metadata.nature },
    {
      name: "Next Breed Status", value: secondsSince(metadata.lastBreedTime) > 604_800_000
        ? "Ready"
        : Math.floor((
        Date.parse(metadata.lastBreedTime) + 604_800_000
      ) / 86_400_000) + " Days",
    },
    { name: "Breeding Cooldown", value: Math.max(7 - metadata.generation, 1) + " Days" },
  ];
  return (
    <AccordionItem
      value="breeding"
      className="data-[state=open]:[&>:nth-child(2)>:first-child]:pb-0 data-[state=open]:[&>:nth-child(2)>:first-child]:border-b-0"
    >
      <AccordionTrigger>Breeding</AccordionTrigger>
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
AssetBreeding.displayName = "AssetBreeding";

export { AssetBreeding };
