import { BASE_URL } from "@/data/constants";
import type { SquidAsset } from "@/lib/squid/types";
import { cn } from "@workspace/ui/lib/utils";
import Image from "next/image";

const EvoImage = ({ asset, className }: { asset: SquidAsset, className?: string }) => {
  return (
    <Image
      src={`${BASE_URL}/api/images/${asset.metadata.type.toLowerCase()}/${asset.tokenId}`}
      alt={asset.metadata.species}
      fill
      unoptimized
      className={cn("object-contain object-center", className)}
    />
  );
};
EvoImage.displayName = "EvoImage";

export { EvoImage };
