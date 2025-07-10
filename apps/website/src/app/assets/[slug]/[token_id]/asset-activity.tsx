"use client";
import { useEvo } from "@/hooks/use-evo";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@workspace/ui/components/accordion";

const AssetActivity = ({ tokenId }: { tokenId: string }) => {
  const { data, isFetching, isPlaceholderData, isLoading } = useEvo(tokenId);
  if (isFetching || isLoading || isPlaceholderData) {
    return (
      <AccordionItem value="activity">
        <AccordionTrigger>Activity</AccordionTrigger>
      </AccordionItem>
    );
  }
  return (
    <AccordionItem
      value="activity"
      className="data-[state=open]:[&>:nth-child(2)>:first-child]:pb-0 data-[state=open]:[&>:nth-child(2)>:first-child]:border-b-0"
    >
      <AccordionTrigger>Activity</AccordionTrigger>
      <AccordionContent>
        Coming Soon!
      </AccordionContent>
    </AccordionItem>
  );
};

export { AssetActivity };
