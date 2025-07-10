import { keccak256 } from "@subsquid/evm-abi";
import { StateStatus, TokenType } from "../../model";
import type { LogGenericEventData } from "../../types/shared";

export type NewEnglishAuctionEventData = {
  quantity: bigint;
  minimumBidAmount: bigint;
  buyoutBidAmount: bigint;
  tokenId: bigint;
  startAt: Date;
  endAt: Date;
  timeBufferInSeconds: number;
  bidBufferBps: number;
  status: StateStatus;
  currencyAddress: string;
  auctionId: bigint;
  creatorAddress: string;
  assetAddress: string;
  tokenType: TokenType;
  txHash: string;
  blockNumber: number;
  marketplace: string;
}
export type ClosedEnglishAuctionEventData = {
  auctionId: bigint;
  winningBidder: string;
  closer: string;
  marketplace: string;
}
export type CancelledEnglishAuctionEventData = {
  auctionId: bigint;
  creator: string;
  marketplace: string;
}

export type NewEnglishAuctionBidEventData = NewEnglishAuctionEventData & {
  bidder: string;
  bidAmount: bigint;
}

export type NewDirectListingEventData = {
  listingId: bigint;
  tokenId: bigint;
  quantity: bigint;
  pricePerToken: bigint;
  startAt: Date;
  endAt: Date;
  tokenType: TokenType;
  status: StateStatus;
  reserved: boolean;
  creatorAddress: string;
  assetAddress: string;
  currencyAddress: string;
  txHash: string;
  blockNumber: number;
  marketplace: string
}

export type UpdatedDirectListingEventData = NewDirectListingEventData;

export type CancelledDirectListingEventData = {
  listingId: bigint;
  creatorAddress: string;
  marketplace: string
}

export type NewDirectListingSaleEventData = {
  listingId: bigint;
  tokenId: bigint;
  quantityBought: bigint;
  totalPricePaid: bigint;
  creatorAddress: string;
  buyerAddress: string;
  assetAddress: string;
  marketplace: string;
  txHash: string;
  blockNumber: number;
}

type BaseOfferEventData = {
  offerId: bigint;
  offerorAddress: string;
  marketplace: string;
}
export type NewOfferEventData = BaseOfferEventData & {
  tokenId: bigint;
  quantity: bigint;
  totalPrice: bigint;
  expiresAt: Date;
  assetAddress: string;
  currencyAddress: string;
  tokenType: TokenType;
  txHash: string;
  blockNumber: number;
}

export type AcceptedOfferEventData = BaseOfferEventData & {
  sellerAddress: string;
  quantityBought: bigint;
  totalPricePaid: bigint;
  tokenId: bigint;
  assetContract: string;
}

export type CancelledOfferEventData = BaseOfferEventData

export type RoleGrantedEventData = LogGenericEventData & {
  role: MarketplaceRole;
  account: string;
}

export type RoleRevokedEventData = RoleGrantedEventData;

export enum MarketplaceRole {
  DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000",
  ASSET_ROLE = "0x86d5cf0a6bdc8d859ba3bdc97043337c82a0e609035f378e419298b6a3e00ae6",
  LISTER_ROLE = "0xf94103142c1baabe9ac2b5d1487bf783de9e69cfeea9a72f5c9c94afd7877b8c"
}
