import { events } from "../../abi/generated/breeder-brenda";
import type { Context } from "../../model/context";
import type { BreedDeniedEventData, BreedMintedEventData, BreedRequestedEventData } from "../../types/nft";
import type { Log } from "../../types/processor";
import { parseLogGenerics } from "../shared";
import { BreedingRequest, BreedingStatus, Contract, ContractType, NFT, Transaction, Wallet } from "../../model";
import { getOrCreateContract } from "../core/contracts";
import { getOrCreateWallet } from "../wallets";
import { getOrCreateNft } from "./nfts";

export const parseBreedingEvents = (ctx: Context, logs: Log[]) => {
  const breedRequestEvents: BreedRequestedEventData[] = [];
  const breedMintEvents: BreedMintedEventData[] = [];
  const breedDeniedEvents: BreedDeniedEventData[] = [];

  for (let log of logs) {
    switch (log.topics[0]) {
      case events.BreedRequested.topic: {
        breedRequestEvents.push(parseBreedRequestedEvent(ctx, log));
        break;
      }
      case events.BreedMinted.topic: {
        breedMintEvents.push(parseBreedMintedEvent(ctx, log));
        break;
      }
      case events.BreedDenied.topic: {
        breedDeniedEvents.push(parseBreedDeniedEvent(ctx, log));
        break;
      }
    }
  }

  return { breedMintEvents, breedRequestEvents, breedDeniedEvents };
};

export const loadBreedingEntities = (ctx: Context) => ctx.entities.loadMany(Wallet, Contract, NFT, BreedingRequest);

export const processBreedingEvents = (ctx: Context, events: ReturnType<typeof parseBreedingEvents>) => {
  processBreedingRequests(ctx, events.breedRequestEvents);
  processBreedingMinted(ctx, events.breedMintEvents);
  processBreedingDenied(ctx, events.breedDeniedEvents);
}

const parseBreedRequestedEvent = (ctx: Context, log: Log): BreedRequestedEventData => {
  const { requestId, nft, breeder, amountPaid, parent2, parent1 } = events.BreedRequested.decode(log);
  ctx.entities.defer(Contract, log.address, nft);
  ctx.entities.defer(NFT, `${nft}-${parent1}`, `${nft}-${parent2}`);
  ctx.entities.defer(Wallet, breeder);
  ctx.entities.defer(BreedingRequest, `${log.address}-${requestId}`);
  return {
    ...parseLogGenerics(log),
    requestId,
    nft,
    breeder,
    parent1,
    parent2,
    amountPaid,
  };
};

const parseBreedMintedEvent = (ctx: Context, log: Log): BreedMintedEventData => {
  const { mintedBy, tokenId, to, requestId, nft } = events.BreedMinted.decode(log);
  ctx.entities.defer(Contract, log.address, nft);
  ctx.entities.defer(NFT, `${nft}-${tokenId}`);
  ctx.entities.defer(Wallet, to, mintedBy);
  ctx.entities.defer(BreedingRequest, `${log.address}-${requestId}`);

  return {
    ...parseLogGenerics(log),
    nft,
    requestId,
    mintedBy,
    tokenId,
    to,
  };
};

const parseBreedDeniedEvent = (ctx: Context, log: Log): BreedDeniedEventData => {
  const { requestId } = events.BreedDenied.decode(log);
  ctx.entities.defer(Contract, log.address);
  ctx.entities.defer(BreedingRequest, `${log.address}-${requestId}`);

  return {
    ...parseLogGenerics(log),
    requestId
  };
};

const processBreedingRequests = (ctx: Context, events: BreedRequestedEventData[]) => {
  for (let event of events) {
    getOrCreateContract(ctx, event.contract, ContractType.BREEDER);
    const nftContract= getOrCreateContract(ctx, event.nft, ContractType.ERC721);
    ctx.entities.add(new BreedingRequest({
      id: ctx.entities.toId(event.contract, event.requestId),
      requestId: event.requestId,
      breeder: getOrCreateWallet(ctx, event.breeder),
      tx: ctx.entities.getOrFail(Transaction, `${event.blockNumber}-${event.txHash}`, false),
      amountPaid: event.amountPaid,
      parent1: getOrCreateNft(ctx, nftContract, event.parent1),
      parent2: getOrCreateNft(ctx, nftContract, event.parent2),
      status: BreedingStatus.PENDING
    }))
  }
}

const processBreedingMinted = (ctx: Context, events: BreedMintedEventData[]) => {
  for (let event of events) {
    const entity = ctx.entities.getOrFail(BreedingRequest, ctx.entities.toId(event.contract, event.requestId), false);
    entity.status = BreedingStatus.APPROVED
    ctx.entities.add(entity);
  }
}

const processBreedingDenied = (ctx: Context, events: BreedDeniedEventData[]) => {
  for (let event of events) {
    const entity = ctx.entities.getOrFail(BreedingRequest, ctx.entities.toId(event.contract, event.requestId), false);
    entity.status = BreedingStatus.DENIED
    ctx.entities.add(entity);
  }
}