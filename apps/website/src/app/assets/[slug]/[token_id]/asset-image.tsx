"use client";

import { useEvo } from "@/hooks/use-evo";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { EvoCard } from "@workspace/evoverses/components/evo-card";

const AssetImage = ({ tokenId }: { tokenId: string }) => {
  const { data, isFetching, isPlaceholderData, isLoading } = useEvo(tokenId);
  if (isFetching || isLoading || isPlaceholderData) {
    return (
      <Skeleton className="absolute w-full h-full left-0 right-0 top-0 bottom-0 rounded-xl" />
    );
  }
  if (!data) {
    throw new Error("No data");
  }
  return (
    <EvoCard asset={data} />
  );
};
AssetImage.displayName = "AssetImage";

export { AssetImage };
