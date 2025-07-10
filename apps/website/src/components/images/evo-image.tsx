import { EvoCard } from "@workspace/evoverses/components/evo-card";
import type { SquidAsset } from "@workspace/evoverses/lib/asset/types";

const EvoImage = ({ asset, className }: { asset: SquidAsset, className?: string }) => {
  return (
    <EvoCard asset={asset} />
  );
};
EvoImage.displayName = "EvoImage";

export { EvoImage };
