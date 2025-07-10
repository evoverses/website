import { MarketplaceStatus } from "@/lib/squid/types";
import { toTitleCase } from "@/utils/strings";

import type {
  SquidAsset,
  SquidAssetBredEggMetadata,
  SquidAssetEggMetadata,
  SquidAssetEvoMetadata,
  SquidAssetGenesisEggMetadata,
  SquidAssetMetadata,
} from "@workspace/evoverses/lib/asset/types";

export const isEvoAsset = (asset: SquidAsset): asset is SquidAsset<SquidAssetEvoMetadata> => {
  return isEvoMetadata(asset.metadata);
};

export const isEggAsset = (asset: SquidAsset): asset is SquidAsset<SquidAssetEggMetadata> => {
  return isEggMetadata(asset.metadata);
};

export const isEvoMetadata = (metadata: SquidAssetMetadata): metadata is SquidAssetEvoMetadata => {
  return metadata.type === "EVO";
};

export const isEggMetadata = (metadata: SquidAssetMetadata): metadata is SquidAssetEggMetadata | SquidAssetGenesisEggMetadata => {
  return metadata.type === "EGG";
};

export const hasTypes = (metadata: SquidAssetMetadata): metadata is SquidAssetBredEggMetadata => {
  return isEggMetadata(metadata) && metadata.species !== "unknown";
};

export const hasChroma = (metadata: SquidAssetMetadata): metadata is SquidAssetEvoMetadata =>
  !isEggMetadata(metadata) && [ "chroma", "super" ].includes(metadata.chroma);

export const hasRarity = (metadata: SquidAssetMetadata): metadata is SquidAssetEvoMetadata =>
  !isEggMetadata(metadata) && metadata.rarity !== "unknown";

export const isGenesisEgg = (asset: SquidAsset): asset is SquidAsset<SquidAssetGenesisEggMetadata> => isEggAsset(asset)
  && asset.metadata.generation
  === 0;
export const toAssetFullName = (asset: SquidAsset) => {
  const parts = [];
  parts.push(isGenesisEgg(asset) ? "Genesis" : toTitleCase(asset.metadata.species));
  if (isEggAsset(asset)) {
    parts.push("Egg");
  }
  parts.push(`#${asset.tokenId}`);
  return parts.join(" ");
};

export const getActiveListing = (asset: SquidAsset) => asset.listings
  .filter(l => l.status === MarketplaceStatus.ACTIVE)
  .filter(l => l.creator.toLowerCase() === asset.owner.toLowerCase())
  .sort((a, b) => Date.parse(a.endAt) - Date.parse(b.endAt))[0];

export const getLastSale = (asset: SquidAsset) => asset.listings.map(l => l.sales)
  .flat()
  .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))[0];
