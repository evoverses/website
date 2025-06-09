"use client";
import { BASE_URL } from "@/data/constants";
import { useEvo } from "@/hooks/use-evo";
import { Skeleton } from "@workspace/ui/components/skeleton";
import Image from "next/image";

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
    <Image
      src={`${BASE_URL}/api/images/${data.metadata.type.toLowerCase()}/${data.tokenId}`}
      alt={data.metadata.species}
      fill
      unoptimized
      className="object-contain object-top"
    />
  );
};
AssetImage.displayName = "AssetImage";

export { AssetImage };
