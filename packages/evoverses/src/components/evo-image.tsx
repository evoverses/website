import React, { ComponentProps } from "react";
import { getEvoCardEvoImageUrl } from "@workspace/evoverses/lib/asset/utils";
import { cn } from "@workspace/ui/lib/utils";
import { SquidAsset } from "@workspace/evoverses/lib/asset/types";

const EvoImage = ({
  asset,
  className,
  ...props
}: Omit<ComponentProps<"img">, "src" | "alt"> & { asset: SquidAsset }) => {
  return (
    <img
      src={getEvoCardEvoImageUrl(asset)}
      className={cn("aspect-square select-none pointer-events-none", className)}
      alt="evo image"
      {...props}
    />
  );
};
EvoImage.displayName = "EvoImage";

export { EvoImage };