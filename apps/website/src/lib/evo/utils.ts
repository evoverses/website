import type {
  SquidAsset,
  SquidAssetBredEggMetadata,
  SquidAssetEggMetadata,
  SquidAssetEvoMetadata,
  SquidAssetGenesisEggMetadata,
  SquidAssetMetadata,
} from "@/lib/squid/types";

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
  return isEggMetadata(metadata) && metadata.species !== "Unknown";
};

export const hasChroma = (metadata: SquidAssetMetadata): metadata is SquidAssetEvoMetadata =>
  !isEggMetadata(metadata) && [ "Chroma", "Super" ].includes(metadata.chroma);

export const hasRarity = (metadata: SquidAssetMetadata): metadata is SquidAssetEvoMetadata =>
  !isEggMetadata(metadata) && metadata.rarity !== "Unknown";

export const isGenesisEgg = (asset: SquidAsset): asset is SquidAsset<SquidAssetGenesisEggMetadata> => isEggAsset(asset)
  && asset.metadata.generation
  === 0;
export const toAssetFullName = (asset: SquidAsset) => {
  const parts = [];
  parts.push(isGenesisEgg(asset) ? "Genesis" : asset.metadata.species);
  if (isEggAsset(asset)) {
    parts.push("Egg");
  }
  parts.push(`#${asset.tokenId}`);
  return parts.join(" ");
};
