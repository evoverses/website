import { events as marketplaceEvents, events } from "../../abi/marketplaceV3";
import {
  Contract,
  ContractType,
  DirectListing,
  DirectListingSale,
  Marketplace,
  NFT,
  StateStatus,
  Token,
  Transaction,
  Wallet,
} from "../../model";
import type { Log } from "../../types/processor";
import {
  convertChainNumericStatus,
  convertChainNumericTokenType,
  convertTokenTypeToContractType,
  toDate,
} from "../../utils";
import type { Context } from "../../model/context";
import { getOrCreateNft } from "../asset/nfts";
import { getOrCreateToken } from "../asset/tokens";
import { getOrCreateContract } from "../core/contracts";
import { getOrCreateWallet } from "../wallets";
import { getOrCreateMarketplace } from "./marketplaces";
import type {
  CancelledDirectListingEventData,
  NewDirectListingEventData,
  NewDirectListingSaleEventData,
  UpdatedDirectListingEventData,
} from "./types";

export const parseDirectListingEvents = (ctx: Context, logs: Log[]) => {
  const newDirectListingEvents: NewDirectListingEventData[] = [];
  const updatedDirectListingEvents: UpdatedDirectListingEventData[] = [];
  const cancelledDirectListingEvents: CancelledDirectListingEventData[] = [];
  const newDirectListingSaleEvents: NewDirectListingSaleEventData[] = [];

  for (let log of logs) {
    switch (log.topics[0]) {
      case marketplaceEvents.NewListing.topic: {
        newDirectListingEvents.push(parseNewDirectListingEvent(ctx, log));
        break;
      }
      case marketplaceEvents.UpdatedListing.topic: {
        updatedDirectListingEvents.push(parseUpdatedDirectListingEvent(ctx, log));
        break;
      }
      case marketplaceEvents.CancelledListing.topic: {
        cancelledDirectListingEvents.push(parseCancelledDirectListingEvent(ctx, log));
        break;
      }
      case marketplaceEvents.NewSale.topic: {
        newDirectListingSaleEvents.push(parseNewDirectListingSaleEvent(ctx, log));
        break;
      }
    }
  }
  return {
    newDirectListingEvents,
    updatedDirectListingEvents,
    cancelledDirectListingEvents,
    newDirectListingSaleEvents,
  };
};

export const loadDirectListingEntities = (ctx: Context) => ctx.entities.loadMany(
  Marketplace,
  Contract,
  NFT,
  Token,
  Wallet,
  DirectListing,
  DirectListingSale,
);

const parseNewDirectListingEvent = (ctx: Context, log: Log): NewDirectListingEventData => {
  const {
    listing: {
      listingId,
      tokenId,
      quantity,
      pricePerToken,
      startTimestamp,
      endTimestamp,
      listingCreator,
      assetContract,
      currency,
      tokenType,
      status,
      reserved,
    },
  } = events.NewListing.decode(log);
  ctx.entities.defer(Marketplace, log.address);
  ctx.entities.defer(Contract, log.address, currency, assetContract);
  ctx.entities.defer(NFT, `${assetContract}-${tokenId}`);
  ctx.entities.defer(Token, currency);
  ctx.entities.defer(Wallet, listingCreator);
  return {
    listingId,
    tokenId,
    quantity,
    pricePerToken,
    startAt: toDate(startTimestamp),
    endAt: toDate(endTimestamp),
    tokenType: convertChainNumericTokenType(tokenType),
    status: convertChainNumericStatus(status),
    reserved,
    creatorAddress: listingCreator,
    assetAddress: assetContract,
    currencyAddress: currency,
    marketplace: log.address,
    txHash: log.transactionHash,
    blockNumber: log.block.height,
  };
};

const parseNewDirectListingSaleEvent = (ctx: Context, log: Log): NewDirectListingSaleEventData => {
  const {
    listingCreator,
    listingId,
    assetContract,
    tokenId,
    buyer,
    quantityBought,
    totalPricePaid,
  } = events.NewSale.decode(log);
  ctx.entities.defer(Marketplace, log.address);
  ctx.entities.defer(Contract, log.address, assetContract);
  ctx.entities.defer(NFT, `${assetContract}-${tokenId}`);
  ctx.entities.defer(Wallet, listingCreator, buyer);
  ctx.entities.defer(DirectListing, `${log.address}-${listingId}`);
  return {
    listingId,
    tokenId,
    quantityBought,
    totalPricePaid,
    creatorAddress: listingCreator,
    buyerAddress: buyer,
    assetAddress: assetContract,
    marketplace: log.address,
    txHash: log.transactionHash,
    blockNumber: log.block.height,
  };
};

const parseUpdatedDirectListingEvent = (ctx: Context, log: Log): UpdatedDirectListingEventData => {
  const {
    listing: {
      listingId,
      tokenId,
      quantity,
      pricePerToken,
      startTimestamp,
      endTimestamp,
      listingCreator,
      assetContract,
      currency,
      tokenType,
      status,
      reserved,
    },
  } = events.UpdatedListing.decode(log);
  ctx.entities.defer(Marketplace, log.address);
  ctx.entities.defer(Contract, log.address, assetContract, currency);
  ctx.entities.defer(NFT, `${assetContract}-${tokenId}`);
  ctx.entities.defer(Wallet, listingCreator);
  ctx.entities.defer(DirectListing, `${log.address}-${listingId}`);
  return {
    listingId,
    tokenId,
    quantity,
    pricePerToken,
    startAt: toDate(startTimestamp),
    endAt: toDate(endTimestamp),
    tokenType: convertChainNumericTokenType(tokenType),
    status: convertChainNumericStatus(status),
    creatorAddress: listingCreator,
    assetAddress: assetContract,
    currencyAddress: currency,
    marketplace: log.address,
    reserved,
    txHash: log.transactionHash,
    blockNumber: log.block.height,
  };
};

const parseCancelledDirectListingEvent = (ctx: Context, log: Log): CancelledDirectListingEventData => {
  const { listingCreator, listingId } = events.CancelledListing.decode(log);
  ctx.entities.defer(Marketplace, log.address);
  ctx.entities.defer(Contract, log.address);
  ctx.entities.defer(Wallet, listingCreator);
  ctx.entities.defer(DirectListing, `${log.address}-${listingId}`);
  return { listingId, creatorAddress: listingCreator, marketplace: log.address };
};

export const processDirectListingEvents = (
  ctx: Context,
  events: ReturnType<typeof parseDirectListingEvents>,
) => {
  const {
    newDirectListingEvents,
    updatedDirectListingEvents,
    cancelledDirectListingEvents,
    newDirectListingSaleEvents,
  } = events;
  for (let event of newDirectListingEvents) {
    ctx.entities.add(new DirectListing({
      id: ctx.entities.toId(`${event.marketplace}-${event.listingId}`),
      listingId: event.listingId,
      marketplace: getOrCreateMarketplace(ctx, getOrCreateContract(ctx, event.marketplace, ContractType.MARKETPLACE)),
      tx: ctx.entities.getOrFail(Transaction, `${event.blockNumber}-${event.txHash}`, false),
      creator: getOrCreateWallet(ctx, event.creatorAddress),
      nft: getOrCreateNft(
        ctx,
        getOrCreateContract(ctx, event.assetAddress, convertTokenTypeToContractType(event.tokenType)),
        event.tokenId,
      ),
      quantity: event.quantity,
      pricePerToken: event.pricePerToken,
      currency: getOrCreateToken(ctx, getOrCreateContract(ctx, event.currencyAddress, ContractType.ERC20)),
      startAt: event.startAt,
      endAt: event.endAt,
      reserved: event.reserved,
      type: event.tokenType,
      status: event.status,
    }));
  }
  for (let event of updatedDirectListingEvents) {
    const listing = ctx.entities.getOrFail(DirectListing, `${event.marketplace}-${event.listingId}`, false);
    listing.nft =
      getOrCreateNft(
        ctx,
        getOrCreateContract(ctx, event.assetAddress, convertTokenTypeToContractType(event.tokenType)),
        event.tokenId,
      );
    listing.quantity = event.quantity;
    listing.pricePerToken = event.pricePerToken;
    listing.currency = getOrCreateToken(ctx, getOrCreateContract(ctx, event.currencyAddress, ContractType.ERC20));
    listing.startAt = event.startAt;
    listing.endAt = event.endAt;
    listing.reserved = event.reserved;
    listing.status = event.status;
    listing.type = event.tokenType;
    listing.quantity = event.quantity;
    ctx.entities.add(listing);
  }
  for (let event of cancelledDirectListingEvents) {
    const listing = ctx.entities.getOrFail(DirectListing, `${event.marketplace}-${event.listingId}`, false);
    listing.status = StateStatus.CANCELLED;
    ctx.entities.add(listing);
  }
  for (let event of newDirectListingSaleEvents) {
    ctx.entities.add(new
    DirectListingSale({
      id: ctx.entities.toId(`${event.marketplace}-${event.listingId}`),
      marketplace: getOrCreateMarketplace(ctx, getOrCreateContract(ctx, event.marketplace, ContractType.MARKETPLACE)),
      tx: ctx.entities.getOrFail(Transaction, `${event.blockNumber}-${event.txHash}`, false),
      seller: getOrCreateWallet(ctx, event.creatorAddress),
      buyer: getOrCreateWallet(ctx, event.buyerAddress),
      listing: ctx.entities.getOrFail(DirectListing, `${event.marketplace}-${event.listingId}`, false),
      quantity: event.quantityBought,
      totalPrice: event.totalPricePaid,
    }));
  }
};
