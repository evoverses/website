import type { Species } from "@/lib/evoverses/types";
import type { Chroma, Element, Gender, Nature, Rarity } from "@workspace/database/types/evo";
import type { Address, Hash } from "viem";
import { z } from "zod";

type Status = "CREATED" | "COMPLETED" | "CANCELLED";

export type TxDetail = {
  id?: `${number}-${number}-${Hash}`
  hash: Address;
  block: {
    timestamp: number;
  };
}

type WithAddress = {
  address: Address;
}

type Currency = {
  contract: {
    address: Address;
    name: string;
    symbol: string;
  };
  decimals: number;
}

export type NFTDetailQueryResponse = {
  listings: {
    listingId: string;
    pricePerToken: string;
    startAt: number;
    endAt: number;
    status: Status;
    reserved: boolean;
    quantity: string;
    creator: WithAddress;
    currency: Currency;
    marketplace: {
      contract: WithAddress;
    };
    tx: TxDetail;
  }[];
  sales: {
    quantity: string;
    totalPrice: string;
    tx: TxDetail;
    buyer: WithAddress;
    seller: WithAddress;
  }[];
  auctions: {
    auctionId: string;
    bidBufferBps: number;
    bids: {
      amount: string;
      tx: TxDetail;
    }[];
    buyoutBidAmount: string;
    endAt: number;
    closer: WithAddress | null;
    creator: WithAddress;
    minimumBidAmount: string;
    quantity: string;
    startAt: number;
    status: Status;
    timeBufferInSeconds: number;
    tx: TxDetail;
    winningBidder: WithAddress | null;
  }[];
  offers: {
    offerId: string;
    expiresAt: number;
    totalPrice: string;
    quantity: string;
    offeror: WithAddress;
    tx: TxDetail;
    currency: Currency;
    status: Status;
  }[];
};

type MarketplaceCurrency = {
  address: Address;
  name: string;
  symbol: string;
  decimals: number;
}

export type MarketplaceSale = {
  quantity: bigint;
  totalPrice: bigint;
  buyer: Address;
  seller: Address;
  txHash: Address;
  timestamp: Date;
}

export type MarketplaceOffer = {
  id: bigint;
  status: Status;
  totalPrice: bigint;
  quantity: bigint;
  offeror: Address;
  expiresAt: Date;
  txHash: Address;
  timestamp: Date;
  currency: MarketplaceCurrency;
}

export type MarketplaceBid = {
  amount: bigint;
  txHash: Address;
  timestamp: Date;
}

export type MarketplaceAuction = {
  id: bigint;
  bidBufferBps: number;
  quantity: bigint;
  status: Status;
  timeBufferInSeconds: number;
  bids: MarketplaceBid[];
  buyoutBidAmount: bigint;
  minimumBidAmount: bigint;
  startAt: Date;
  endAt: Date;
  closer?: Address;
  creator: Address;
  winningBidder?: Address;
  txHash: Address;
  timestamp: Date;
}

export type MarketplaceListing = {
  id: bigint;
  pricePerToken: bigint;
  quantity: bigint;
  status: Status;
  startAt: Date;
  endAt: Date;
  reserved: boolean;
  creator: Address;
  currency: MarketplaceCurrency;
  txHash: Address;
  timestamp: Date;
}

export type MarketplaceNFTHistoryDetail = {
  listings: MarketplaceListing[];
  sales: MarketplaceSale[];
  auctions: MarketplaceAuction[];
  offers: MarketplaceOffer[];
}

export type SquidError = {
  message: string;
  extensions: {
    code: string;
    exception: {
      stacktrace: string[];
    };
  }
}

// TODO: Fill this out with every option; or import from squid app
export type SquidQueryResponseData = {
  transactions: TxDetail[];
}

export type SquidErrorResponse = {
  errors: SquidError[];
}

export type SquidCurrency = {
  address: Address;
  symbol: string;
  decimals: number;
}

export type SquidPricedCurrency = {
  price: string;
  currency: SquidCurrency;
}

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
}

export type SquidAssetMetadata = SquidAssetEggMetadata | SquidAssetEvoMetadata

export const marketplaceStatusSchema = z.enum([ "UNSET", "CREATED", "ACTIVE", "COMPLETED", "CANCELLED", "EXPIRED" ]);
export const MarketplaceStatus = marketplaceStatusSchema.enum;
export type MarketplaceStatus = z.infer<typeof marketplaceStatusSchema>;

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
