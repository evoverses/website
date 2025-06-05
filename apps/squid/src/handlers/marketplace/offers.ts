import { events as marketplaceEvents, events } from "../../abi/marketplaceV3";
import { Contract, ContractType, Marketplace, NFT, Offer, StateStatus, Token, Transaction, Wallet } from "../../model";
import type { Log } from "../../types/processor";
import { convertChainNumericTokenType, convertTokenTypeToContractType, toDate } from "../../utils";
import type { Context } from "../../utils/context";
import { getOrCreateNft } from "../asset/nfts";
import { getOrCreateToken } from "../asset/tokens";
import { getOrCreateContract } from "../core/contracts";
import { getOrCreateWallet } from "../wallets";
import { getOrCreateMarketplace } from "./marketplaces";
import type { AcceptedOfferEventData, CancelledOfferEventData, NewOfferEventData } from "./types";

export const parseOfferEvents = (ctx: Context, logs: Log[]) => {
  const newOfferEvents: NewOfferEventData[] = [];
  const acceptedOfferEvents: AcceptedOfferEventData[] = [];
  const cancelledOfferEvents: CancelledOfferEventData[] = [];

  for (let log of logs) {
    switch (log.topics[0]) {
      case marketplaceEvents.NewOffer.topic: {
        newOfferEvents.push(parseNewOfferEvent(ctx, log));
        break;
      }
      case marketplaceEvents.AcceptedOffer.topic: {
        acceptedOfferEvents.push(parseAcceptedOfferEvent(ctx, log));
        break;
      }
      case marketplaceEvents.CancelledOffer.topic: {
        cancelledOfferEvents.push(parseCancelledOfferEvent(ctx, log));
        break;
      }
    }
  }
  return {
    newOfferEvents,
    acceptedOfferEvents,
    cancelledOfferEvents,
  };
};

export const loadOfferEntities = (ctx: Context) => ctx.entities.loadMany(
  Marketplace,
  Contract,
  NFT,
  Token,
  Wallet,
  Offer,
);

const parseNewOfferEvent = (ctx: Context, log: Log): NewOfferEventData => {
  const {
    offer: {
      offerId,
      tokenId,
      quantity,
      totalPrice,
      expirationTimestamp,
      offeror,
      assetContract,
      currency,
      tokenType,
    },
  } = events.NewOffer.decode(log);

  ctx.entities.defer(Marketplace, log.address);
  ctx.entities.defer(Contract, log.address, currency, assetContract);
  ctx.entities.defer(Token, currency);
  ctx.entities.defer(NFT, `${assetContract}-${tokenId}`);
  ctx.entities.defer(Wallet, offeror);
  return {
    offerId,
    tokenId,
    quantity,
    totalPrice,
    expiresAt: toDate(expirationTimestamp),
    offerorAddress: offeror,
    assetAddress: assetContract,
    currencyAddress: currency,
    tokenType: convertChainNumericTokenType(tokenType),
    marketplace: log.address,
    txHash: log.transactionHash,
    blockNumber: log.block.height,
  };
};

const parseAcceptedOfferEvent = (ctx: Context, log: Log): AcceptedOfferEventData => {
  const {
    offeror,
    offerId,
    seller,
    quantityBought,
    totalPricePaid,
    tokenId,
    assetContract,
  } = events.AcceptedOffer.decode(log);
  ctx.entities.defer(Marketplace, log.address);
  ctx.entities.defer(Contract, log.address, assetContract);
  ctx.entities.defer(NFT, `${assetContract}-${tokenId}`);
  ctx.entities.defer(Wallet, offeror, seller);
  ctx.entities.defer(Offer, `${log.address}-${offerId}`);
  return {
    offerId,
    offerorAddress: offeror,
    sellerAddress: seller,
    quantityBought,
    totalPricePaid,
    tokenId,
    assetContract,
    marketplace: log.address,
  };
};

const parseCancelledOfferEvent = (ctx: Context, log: Log): CancelledOfferEventData => {
  const { offeror, offerId } = events.CancelledOffer.decode(log);
  ctx.entities.defer(Marketplace, log.address);
  ctx.entities.defer(Contract, log.address);
  ctx.entities.defer(Wallet, offeror);
  ctx.entities.defer(Offer, `${log.address}-${offerId}`);
  return { offerId, offerorAddress: offeror, marketplace: log.address };
};

export const processOfferEvents = (
  ctx: Context,
  events: ReturnType<typeof parseOfferEvents>,
) => {
  const { newOfferEvents, acceptedOfferEvents, cancelledOfferEvents } = events;
  for (let event of newOfferEvents) {
    ctx.entities.add(new Offer({
      id: ctx.entities.toId(`${event.marketplace}-${event.offerId}`),
      offerId: event.offerId,
      marketplace: getOrCreateMarketplace(ctx, getOrCreateContract(ctx, event.marketplace, ContractType.MARKETPLACE)),
      tx: ctx.entities.getOrFail(Transaction, `${event.blockNumber}-${event.txHash}`, false),
      offeror: getOrCreateWallet(ctx, event.offerorAddress),
      nft: getOrCreateNft(
        ctx,
        getOrCreateContract(ctx, event.assetAddress, convertTokenTypeToContractType(event.tokenType)),
        event.tokenId,
      ),
      quantity: event.quantity,
      totalPrice: event.totalPrice,
      currency: getOrCreateToken(ctx, getOrCreateContract(ctx, event.currencyAddress, ContractType.ERC20)),
      expiresAt: event.expiresAt,
      status: StateStatus.CREATED,
    }));
  }
  for (let event of acceptedOfferEvents) {
    const offer = ctx.entities.getOrFail(Offer, `${event.marketplace}-${event.offerId}`, false);
    offer.status = StateStatus.COMPLETED;
    offer.seller = getOrCreateWallet(ctx, event.sellerAddress);
    ctx.entities.add(offer);
  }
  for (let event of cancelledOfferEvents) {
    const offer = ctx.entities.getOrFail(Offer, `${event.marketplace}-${event.offerId}`, false);
    offer.status = StateStatus.CANCELLED;
    ctx.entities.add(offer);
  }
};
