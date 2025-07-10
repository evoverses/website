import { Element } from "@workspace/database/types/evo";
import { maxXpTable } from "@workspace/evoverses/lib/asset/data";
import type {
  SquidAsset,
  SquidAssetBredEggMetadata,
  SquidAssetEggMetadata,
  SquidAssetEvoMetadata,
  SquidAssetGenesisEggMetadata,
  SquidAssetMetadata,
} from "@workspace/evoverses/lib/asset/types";
import { toTitleCase } from "@workspace/evoverses/utils/strings";

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

export function isEvo(metadata: SquidAssetMetadata): metadata is SquidAssetEvoMetadata;
export function isEvo(asset: SquidAsset): asset is SquidAsset<SquidAssetEvoMetadata>;
export function isEvo(assetOrMetadata: SquidAssetMetadata | SquidAsset): assetOrMetadata is SquidAssetEvoMetadata | SquidAsset<SquidAssetEvoMetadata>;
export function isEvo(assetOrMetadata: SquidAssetMetadata | SquidAsset): assetOrMetadata is SquidAssetEvoMetadata | SquidAsset<SquidAssetEvoMetadata> {
  return asMetadata(assetOrMetadata).type === "EVO";
}

export function isEgg(metadata: SquidAssetMetadata): metadata is SquidAssetEggMetadata;
export function isEgg(asset: SquidAsset): asset is SquidAsset<SquidAssetEggMetadata>;
export function isEgg(assetOrMetadata: SquidAsset | SquidAssetMetadata): assetOrMetadata is SquidAssetEggMetadata | SquidAsset<SquidAssetEggMetadata>;
export function isEgg(assetOrMetadata: SquidAssetMetadata | SquidAsset): assetOrMetadata is SquidAssetEggMetadata | SquidAsset<SquidAssetEggMetadata> {
  return asMetadata(assetOrMetadata).type === "EGG";
}

export function hasElements(metadata: SquidAssetMetadata): metadata is SquidAssetEvoMetadata | SquidAssetBredEggMetadata;
export function hasElements(asset: SquidAsset): asset is SquidAsset<SquidAssetEvoMetadata | SquidAssetBredEggMetadata>;
export function hasElements(assetOrMetadata: SquidAssetMetadata | SquidAsset): assetOrMetadata is SquidAssetEvoMetadata | SquidAssetBredEggMetadata | SquidAsset<SquidAssetEvoMetadata | SquidAssetBredEggMetadata>;

export function hasElements(assetOrMetadata: SquidAssetMetadata | SquidAsset): assetOrMetadata is SquidAssetEvoMetadata | SquidAssetBredEggMetadata | SquidAsset<SquidAssetEvoMetadata | SquidAssetBredEggMetadata> {
  const metadata = asMetadata(assetOrMetadata);
  return !isGenesisEgg(metadata) && metadata.primaryType && metadata.primaryType !== Element.none;
}

export const hasTypes = (metadata: SquidAssetMetadata): metadata is SquidAssetBredEggMetadata => {
  return isEggMetadata(metadata) && metadata.species !== "unknown";
};

export function hasChroma(metadata: SquidAssetMetadata): metadata is SquidAssetEvoMetadata;
export function hasChroma(asset: SquidAsset): asset is SquidAsset<SquidAssetEvoMetadata>;
export function hasChroma(assetOrMetadata: SquidAssetMetadata | SquidAsset): assetOrMetadata is SquidAssetEvoMetadata | SquidAsset<SquidAssetEvoMetadata>
export function hasChroma(assetOrMetadata: SquidAssetMetadata | SquidAsset): assetOrMetadata is SquidAssetEvoMetadata | SquidAsset<SquidAssetEvoMetadata> {
  const metadata = asMetadata(assetOrMetadata);
  return !isEggMetadata(metadata) && [ "chroma", "super" ].includes(metadata.chroma);
}

export function hasRarity(metadata: SquidAssetMetadata): metadata is SquidAssetEvoMetadata;
export function hasRarity(asset: SquidAsset): asset is SquidAsset<SquidAssetEvoMetadata>;
export function hasRarity(assetOrMetadata: SquidAssetMetadata | SquidAsset): assetOrMetadata is SquidAssetEvoMetadata | SquidAsset<SquidAssetEvoMetadata>
export function hasRarity(assetOrMetadata: SquidAssetMetadata | SquidAsset): assetOrMetadata is SquidAssetEvoMetadata | SquidAsset<SquidAssetEvoMetadata> {
  const metadata = asMetadata(assetOrMetadata);
  return !isEgg(metadata) && metadata.rarity !== "unknown";
}

export const asMetadata = <T extends SquidAssetMetadata | SquidAsset>(assetOrMetadata: T): SquidAssetMetadata => {
  return "metadata" in assetOrMetadata ? assetOrMetadata.metadata : assetOrMetadata;
};

export function isGenesisEgg(metadata: SquidAssetMetadata): metadata is SquidAssetGenesisEggMetadata;
export function isGenesisEgg(asset: SquidAsset): asset is SquidAsset<SquidAssetGenesisEggMetadata>;
export function isGenesisEgg(assetOrMetadata: SquidAssetMetadata | SquidAsset): assetOrMetadata is SquidAssetGenesisEggMetadata | SquidAsset<SquidAssetGenesisEggMetadata>
export function isGenesisEgg(assetOrMetadata: SquidAssetMetadata | SquidAsset): assetOrMetadata is SquidAssetGenesisEggMetadata | SquidAsset<SquidAssetGenesisEggMetadata> {
  return isEgg(assetOrMetadata) && isGen0(assetOrMetadata);
}

export function isGen0(metadata: SquidAssetMetadata): boolean;
export function isGen0(asset: SquidAsset): boolean;
export function isGen0(assetOrMetadata: SquidAssetMetadata | SquidAsset): boolean;
export function isGen0(assetOrMetadata: SquidAssetMetadata | SquidAsset): boolean {
  return asMetadata(assetOrMetadata).generation === 0;
}

export function isTreated(metadata: SquidAssetMetadata): boolean;
export function isTreated(asset: SquidAsset): boolean;
export function isTreated(assetOrMetadata: SquidAssetMetadata | SquidAsset): boolean;
export function isTreated(assetOrMetadata: SquidAssetMetadata | SquidAsset): boolean {
  const metadata = asMetadata(assetOrMetadata);
  return isEgg(metadata) && metadata.treated;
}

export const toAssetFullName = (asset: SquidAsset) => {
  const parts = [];
  parts.push(isGenesisEgg(asset) ? "Genesis" : toTitleCase(asset.metadata.species));
  if (isEggAsset(asset)) {
    parts.push("Egg");
  }
  parts.push(`#${asset.tokenId}`);
  return parts.join(" ");
};

export const getLevelOfEvo = (evo: SquidAsset | SquidAssetMetadata): number => {
  const metadata = asMetadata(evo);
  if (isEgg(metadata)) {
    return 1;
  }
  return Array.from(Array(100)) // Create an array with 100 items
    .fill(1) // fill that array with 1s
    .map((n, i) => n + i) // change those numbers to be 1-100
    .reduce(
      (cLevel, level) => // get just 1 number by iterating over the array and doing the math
        // if evo experience is greater than or equal to the max cumulative xp of this level, return this level,
        // else return the last saved level
        metadata.xp >= Math.round(Math.pow(level, 3) * (
          maxXpTable[metadata.species] / 1_000_000
        ))
          ? level
          : cLevel,
      1,
    );
};

export const baseImageApiUrl = process.env.NEXT_PUBLIC_BASE_API_IMAGE_URL;
export const imageApiSuffix = process.env.NEXT_PUBLIC_API_IMAGE_SUFFIX;

const asImageUrl = (url: string) => `${baseImageApiUrl}/${url.replace(/\/$/, "").replace(/^\//, "")}/${imageApiSuffix}`;

export const getEvoCardEvoImageUrl = (evo: SquidAsset) => {
  const base = `/evo/${evo.metadata.species}`;
  const isEgg = isEggAsset(evo);
  if (isEgg) {
    return asImageUrl(`${base}/${evo.metadata.generation === 0 ? Number(evo.tokenId) % 4 : "egg"}`);
  }
  return asImageUrl(hasChroma(evo) ? `${base}/${evo.metadata.chroma}` : base);
};

export const getEvoCardBorderUrl = (evo: SquidAsset) => {
  let color = "silver";
  if (hasRarity(evo)) {
    color = "silver"; // TODO: metadata.rarity === TBD;
  }
  return asImageUrl(`/card/border/${color}-metallic/4`);
};

export const getEvoCardElementBackgroundUrl = (evo: SquidAsset) => {
  return asImageUrl(`/card/background/${hasElements(evo) ? evo.metadata.primaryType : "genesis"}`);
};

export const getInfoIslandUrl = () => {
  return asImageUrl(`/card/overlay/info-island`);
};
