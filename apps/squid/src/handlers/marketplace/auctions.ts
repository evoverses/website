import { events as marketplaceEvents, events } from "../../abi/marketplaceV3";
import {
  Contract,
  ContractType,
  EnglishAuction,
  EnglishAuctionBid,
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
import type { Context } from "../../utils/context";
import { getOrCreateNft } from "../asset/nfts";
import { getOrCreateToken } from "../asset/tokens";
import { getOrCreateContract } from "../core/contracts";
import { getOrCreateWallet } from "../wallets";
import { getOrCreateMarketplace } from "./marketplaces";
import type {
  CancelledEnglishAuctionEventData,
  ClosedEnglishAuctionEventData,
  NewEnglishAuctionBidEventData,
  NewEnglishAuctionEventData,
} from "./types";

export const parseEnglishAuctionEvents = (ctx: Context, logs: Log[]) => {
  const newEnglishAuctionEvents: NewEnglishAuctionEventData[] = [];
  const closedEnglishAuctionEvents: ClosedEnglishAuctionEventData[] = [];
  const cancelledEnglishAuctionEvents: CancelledEnglishAuctionEventData[] = [];
  const newEnglishAuctionBidEvents: NewEnglishAuctionBidEventData[] = [];
  for (let log of logs) {
    switch (log.topics[0]) {
      case marketplaceEvents.NewAuction.topic: {
        newEnglishAuctionEvents.push(parseNewEnglishAuctionEvent(ctx, log));
        break;
      }
      case marketplaceEvents.AuctionClosed.topic: {
        closedEnglishAuctionEvents.push(parseClosedEnglishAuctionEvent(ctx, log));
        break;
      }
      case marketplaceEvents.CancelledAuction.topic: {
        cancelledEnglishAuctionEvents.push(parseCancelledEnglishAuctionEvent(ctx, log));
        break;
      }
      case marketplaceEvents.NewBid.topic: {
        newEnglishAuctionBidEvents.push(parseNewEnglishAuctionBidEvent(ctx, log));
        break;
      }
    }
  }
  return {
    newEnglishAuctionEvents,
    closedEnglishAuctionEvents,
    cancelledEnglishAuctionEvents,
    newEnglishAuctionBidEvents,
  };
};

export const loadEnglishAuctionEntities = (ctx: Context) => ctx.entities.loadMany(
  Marketplace,
  Contract,
  NFT,
  Token,
  Wallet,
  EnglishAuction,
  EnglishAuctionBid,
);

const parseNewEnglishAuctionEvent = (ctx: Context, log: Log): NewEnglishAuctionEventData => {
  const {
    auction: {
      quantity,
      minimumBidAmount,
      buyoutBidAmount,
      startTimestamp,
      endTimestamp,
      timeBufferInSeconds,
      bidBufferBps,
      status,
      tokenId,
      currency,
      auctionId,
      auctionCreator,
      assetContract,
      tokenType,
    },
  } = events.NewAuction.decode(log);
  ctx.entities.defer(Marketplace, log.address);
  ctx.entities.defer(Contract, log.address, currency, assetContract);
  ctx.entities.defer(Wallet, auctionCreator);
  ctx.entities.defer(Token, currency);
  ctx.entities.defer(NFT, `${assetContract}-${tokenId}`);
  return {
    quantity,
    minimumBidAmount,
    buyoutBidAmount,
    tokenId,
    startAt: toDate(startTimestamp),
    endAt: toDate(endTimestamp),
    timeBufferInSeconds: Number(timeBufferInSeconds),
    bidBufferBps: Number(bidBufferBps),
    status: convertChainNumericStatus(status),
    currencyAddress: currency,
    auctionId,
    creatorAddress: auctionCreator,
    assetAddress: assetContract,
    txHash: log.transactionHash,
    blockNumber: log.block.height,
    tokenType: convertChainNumericTokenType(tokenType),
    marketplace: log.address,
  };
};

const parseNewEnglishAuctionBidEvent = (ctx: Context, log: Log): NewEnglishAuctionBidEventData => {
  const {
    auction: {
      quantity,
      minimumBidAmount,
      buyoutBidAmount,
      startTimestamp,
      endTimestamp,
      timeBufferInSeconds,
      bidBufferBps,
      status,
      tokenId,
      currency,
      auctionId,
      auctionCreator,
      assetContract,
      tokenType,
    },
    bidAmount,
    bidder,
  } = events.NewBid.decode(log);
  ctx.entities.defer(Marketplace, log.address);
  ctx.entities.defer(Contract, log.address, currency, assetContract);
  ctx.entities.defer(Token, currency);
  ctx.entities.defer(NFT, `${assetContract}-${tokenId}`);
  ctx.entities.defer(Wallet, auctionCreator, bidder);
  ctx.entities.defer(EnglishAuction, `${log.address}-${auctionId}`);
  return {
    quantity,
    minimumBidAmount,
    buyoutBidAmount,
    tokenId,
    startAt: toDate(startTimestamp),
    endAt: toDate(endTimestamp),
    timeBufferInSeconds: Number(timeBufferInSeconds),
    bidBufferBps: Number(bidBufferBps),
    status: convertChainNumericStatus(status),
    currencyAddress: currency,
    auctionId,
    creatorAddress: auctionCreator,
    assetAddress: assetContract,
    marketplace: log.address,
    bidder,
    tokenType: convertChainNumericTokenType(tokenType),
    txHash: log.transactionHash,
    blockNumber: log.block.height,
    bidAmount,
  };
};

const parseCancelledEnglishAuctionEvent = (ctx: Context, log: Log): CancelledEnglishAuctionEventData => {
  const { auctionId, auctionCreator } = events.CancelledAuction.decode(log);
  ctx.entities.defer(Marketplace, log.address);
  ctx.entities.defer(Contract, log.address);
  ctx.entities.defer(Wallet, auctionCreator);
  ctx.entities.defer(EnglishAuction, `${log.address}-${auctionId}`);
  return { auctionId, creator: auctionCreator, marketplace: log.address };
};

const parseClosedEnglishAuctionEvent = (ctx: Context, log: Log): ClosedEnglishAuctionEventData => {
  const { auctionId, winningBidder, closer } = events.AuctionClosed.decode(log);
  ctx.entities.defer(Marketplace, log.address);
  ctx.entities.defer(Contract, log.address);
  ctx.entities.defer(Wallet, winningBidder, closer);
  ctx.entities.defer(EnglishAuction, `${log.address}-${auctionId}`);
  return { auctionId, winningBidder, closer, marketplace: log.address };
};

export const processEnglishAuctionEvents = (
  ctx: Context,
  events: ReturnType<typeof parseEnglishAuctionEvents>,
) => {
  const {
    newEnglishAuctionEvents,
    closedEnglishAuctionEvents,
    cancelledEnglishAuctionEvents,
    newEnglishAuctionBidEvents,
  } = events;
  for (let event of newEnglishAuctionEvents) {
    ctx.entities.add(new EnglishAuction({
      id: ctx.entities.toId(`${event.marketplace}-${event.auctionId}`),
      auctionId: event.auctionId,
      marketplace: getOrCreateMarketplace(ctx, getOrCreateContract(ctx, event.marketplace, ContractType.MARKETPLACE)),
      tx: ctx.entities.getOrFail(Transaction, `${event.blockNumber}-${event.txHash}`, false),
      creator: getOrCreateWallet(ctx, event.creatorAddress),
      nft: getOrCreateNft(
        ctx,
        getOrCreateContract(ctx, event.assetAddress, convertTokenTypeToContractType(event.tokenType)),
        event.tokenId,
      ),
      quantity: event.quantity,
      minimumBidAmount: event.minimumBidAmount,
      buyoutBidAmount: event.buyoutBidAmount,
      currency: getOrCreateToken(ctx, getOrCreateContract(ctx, event.currencyAddress, ContractType.ERC20)),
      startAt: event.startAt,
      endAt: event.endAt,
      timeBufferInSeconds: event.timeBufferInSeconds,
      bidBufferBps: event.bidBufferBps,
      status: event.status,
    }));
  }
  for (let event of newEnglishAuctionBidEvents) {
    ctx.entities.add(new EnglishAuctionBid({
      id: ctx.entities.toId(`${event.marketplace}-${event.auctionId}-${event.bidAmount}`),
      auction: ctx.entities.getOrFail(EnglishAuction, `${event.marketplace}-${event.auctionId}`, false),
      bidder: getOrCreateWallet(ctx, event.bidder),
      amount: event.bidAmount,
    }));
  }
  for (let event of cancelledEnglishAuctionEvents) {
    const auction = ctx.entities.getOrFail(EnglishAuction, `${event.marketplace}-${event.auctionId}`, false);
    auction.status = StateStatus.CANCELLED;
    ctx.entities.add(auction);
  }
  for (let event of closedEnglishAuctionEvents) {
    const auction = ctx.entities.getOrFail(EnglishAuction, `${event.marketplace}-${event.auctionId}`, false);
    auction.status = StateStatus.COMPLETED;
    auction.winningBidder = getOrCreateWallet(ctx, event.winningBidder);
    auction.closer = getOrCreateWallet(ctx, event.closer);
    ctx.entities.add(auction);
  }
};
