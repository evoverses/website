"use client";
import { EvoImage } from "@/components/images/evo-image";
import { useEvo } from "@/hooks/use-evo";
import { Skeleton } from "@workspace/ui/components/skeleton";

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
    <EvoImage asset={data} />
  );
};
AssetImage.displayName = "AssetImage";

export { AssetImage };
