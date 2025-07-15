import type { Chroma, Element, Gender, Nature, Rarity, Species } from "@workspace/database/types/evo";
import type { MarketplaceStatus } from "@workspace/database/types/marketplace";
import type { Address } from "@workspace/evoverses/types/viem";

export type SquidAssetBase = {
  createdAt: string;
  updatedAt: string;
  generation: number;
}

type SquidAssetEggBase = SquidAssetBase & {
  type: "EGG";
  treated: boolean;
}

export type SquidAssetNonGenesisBase = {
  parent1Id: string | null;
  parent2Id: string | null;
  primaryType: Element;
  secondaryType: Element;
}

export type SquidAssetGenesisEggMetadata = SquidAssetEggBase & {
  species: "Unknown";
}

export type SquidAssetBredEggMetadata = SquidAssetEggBase & SquidAssetNonGenesisBase & {
  species: Species;
}

export type SquidAssetEggMetadata = SquidAssetGenesisEggMetadata | SquidAssetBredEggMetadata

export type SquidAssetEvoMetadata = SquidAssetBase & SquidAssetNonGenesisBase & {
  type: "EVO";
  species: Species;
  gender: Gender;
  nature: Nature;
  rarity: Rarity;
  chroma: Chroma;
  xp: number;
  speed: number;
  attack: number;
  defense: number;
  special: number;
  resistance: number;
  size: number;
  totalBreeds: number;
  lastBreedTime: string;
  hatchedAt: string;
}

export type SquidAssetMetadata = SquidAssetEggMetadata | SquidAssetEvoMetadata

export type SquidAssetOffer = {
  id: string
  quantity: string
  totalPrice: string
  expiresAt: string
  currency: Address
  offeror: Address
  status: MarketplaceStatus
}

export type SquidAssetListingSale = {
  quantity: string
  buyer: Address
  totalPrice: string
  timestamp: string
}

export type SquidAssetListing = {
  id: string
  quantity: string
  pricePerToken: string
  startAt: string
  endAt: string
  currency: Address
  creator: Address
  status: MarketplaceStatus
  sales: SquidAssetListingSale[]
}

export type SquidAssetAuction = {
  id: string
  quantity: string
  minimumBidAmount: string
  buyoutBidAmount: string
  startAt: string
  endAt: string
  currency: Address
  creator: Address
  status: MarketplaceStatus
}
export type SquidAsset<T extends SquidAssetMetadata = SquidAssetMetadata> = {
  tokenId: string;
  chainId: string;
  address: Address;
  owner: Address;
  metadata: T;
  offers: SquidAssetOffer[];
  listings: SquidAssetListing[];
  auctions: SquidAssetAuction[];
}

export type SquidMarketplaceSummary = {
  floorPrice: string;
  topOffer: string;
  totalVolume: string;
  activeListings: number;
  uniqueOwners: number;
  total: number;
}
