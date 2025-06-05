import { type BatchMetadataUpdateEventArgs, events as erc1155Events } from "../../abi/erc1155";
import { events as erc721Events } from "../../abi/erc721";
import { Contract, ContractType, NFT, Wallet } from "../../model";

import type { MetadataUpdateEventData, TransferEventData } from "../../types/nft";
import type { Log } from "../../types/processor";
import { eventsToContractMap, range, toDate } from "../../utils";
import type { Context } from "../../utils/context";

import { getOrCreateNftWalletBalance, parseNftTransferEvent } from "../balances";
import { getOrCreateContract } from "../core/contracts";
import { getOrCreateWallet } from "../wallets";

export const getOrCreateNft = (ctx: Context, contract: Contract, tokenId: bigint) => {
  const id = ctx.entities.toId(contract.id, tokenId);
  let nft = ctx.entities.get(NFT, id, false);
  if (!nft) {
    nft = new NFT({ id, tokenId, contract });
    ctx.entities.add(nft);
  }
  if (!nft.contract) {
    nft.contract = contract;
  }
  return nft;
};

export const parseMetadataUpdateEvent = (
  ctx: Context,
  log: Log,
): MetadataUpdateEventData | undefined => {
  const contract = log.address;
  const batchUpdateLogic = (d: BatchMetadataUpdateEventArgs, type: ContractType) => {
    if (d._fromTokenId > d._toTokenId || d._toTokenId - d._fromTokenId > 250) {
      ctx.log.warn(`Skipping large ${type} metadata update event: ${d._fromTokenId}-${d._toTokenId} (${d._toTokenId
      - d._fromTokenId})`);
      return;
    }
    ctx.entities.defer(Contract, log.address);
    ctx.entities.defer(
      NFT,
      ...range(Number(d._fromTokenId), Number(d._toTokenId)).map(tokenId => `${log.address}-${tokenId}`),
    );
    return {
      fromTokenId: d._fromTokenId,
      toTokenId: d._toTokenId,
      contract,
      type,
      timestamp: toDate(log.block.timestamp),
    };
  };
  try {
    switch (log.topics[0]) {
      case erc1155Events.MetadataUpdate.topic: {
        const d = erc1155Events.MetadataUpdate.decode(log);
        ctx.entities.defer(Contract, log.address);
        ctx.entities.defer(NFT, `${log.address}-${d._tokenId}`);
        return {
          fromTokenId: d._tokenId,
          toTokenId: d._tokenId,
          contract,
          type: ContractType.ERC1155,
          timestamp: toDate(log.block.timestamp),
        };
      }
      case erc1155Events.BatchMetadataUpdate.topic: {
        const d = erc1155Events.BatchMetadataUpdate.decode(log);
        return batchUpdateLogic(d, ContractType.ERC1155);
      }
      case erc721Events.BatchMetadataUpdate.topic: {
        const d = erc721Events.BatchMetadataUpdate.decode(log);
        return batchUpdateLogic(d, ContractType.ERC721);
      }
      default: {
        ctx.log.warn(`Skipping unknown metadata update event topic: ${log.topics[0]}`);
        return;
      }
    }
  } catch (e) {
    ctx.log.warn(`Error parsing Metadata Update event: ${e}`);
  }
};

export const parseNftEvents = (ctx: Context, logs: Log[]) => {
  const metadataUpdateEvents: MetadataUpdateEventData[] = [];
  const transferEvents: TransferEventData[] = [];

  for (let log of logs) {
    if (log.address === "0x1e807EfC2416c6CD63cb3B01Dc91232D6F02d50A".toLowerCase()) {
      continue;
    }
    switch (log.topics[0]) {
      case erc1155Events.TransferSingle.topic:
      case erc1155Events.TransferBatch.topic:
      case erc721Events.ConsecutiveTransfer.topic:
      case erc721Events.Transfer.topic: {
        transferEvents.push(...parseNftTransferEvent(ctx, log));
        break;
      }
      case erc1155Events.MetadataUpdate.topic:
      case erc1155Events.BatchMetadataUpdate.topic:
      case erc721Events.BatchMetadataUpdate.topic: {
        const event = parseMetadataUpdateEvent(ctx, log);
        if (event) {
          metadataUpdateEvents.push(event);
        }
        break;
      }
    }
  }

  return { metadataUpdateEvents, transferEvents };
};

export const loadNftEntities = (ctx: Context) => ctx.entities.loadMany(Wallet, Contract, NFT);

export const processNftEvents = (ctx: Context, events: ReturnType<typeof parseNftEvents>) => {
  const { metadataUpdateEvents, transferEvents } = events;
  if (metadataUpdateEvents.length === 0 && transferEvents.length === 0) {
    return;
  }
  if (metadataUpdateEvents.length > 0) {
    ctx.log.debug(`Processing ${metadataUpdateEvents.length} metadata update events`);
  }
  if (transferEvents.length > 0) {
    ctx.log.debug(`Processing ${transferEvents.length} transfer events`);
    ctx.log.debug(`Processing ${transferEvents.filter(e => e.type === "ERC1155").length} ERC1155 transfer events`);
    const transferMap = eventsToContractMap(transferEvents);
    ctx.log.debug(`Processing ${transferEvents.filter(e => e.type
      === "ERC721").length} ERC721 transfer events. (${transferMap.size} unique addresses)`);
  }
  processMetadataUpdateEvents(ctx, metadataUpdateEvents);
  processTransferEvents(ctx, transferEvents);
};

export const processMetadataUpdateEvents = (ctx: Context, metadataUpdateEvents: MetadataUpdateEventData[]) => {
  for (let event of metadataUpdateEvents) {
    const contract = getOrCreateContract(ctx, event.contract, event.type);
    for (let tokenId = event.fromTokenId; tokenId <= event.toTokenId; tokenId++) {
      const nft = getOrCreateNft(ctx, contract, tokenId);
      if (toDate(nft.updatedAt) <= toDate(event.timestamp)) {
        nft.updatedAt = toDate(event.timestamp);
        ctx.entities.add(nft);
      }
    }
  }
};

export const processTransferEvents = (ctx: Context, transferEvents: TransferEventData[]) => {
  for (let event of transferEvents) {
    const contract = getOrCreateContract(ctx, event.contract, event.type);
    for (let tokenId = event.fromTokenId; tokenId <= event.toTokenId; tokenId++) {
      const nft = getOrCreateNft(ctx, contract, tokenId);
      if (event.type === "ERC721") {
        const owner = getOrCreateWallet(ctx, event.to);
        if (!nft.owner || nft.owner.id !== owner.id) {
          nft.owner = owner;
          nft.updatedAt = toDate(event.timestamp);
          ctx.entities.add(nft);
        }
      } else {
        const from = getOrCreateNftWalletBalance(ctx, nft, getOrCreateWallet(ctx, event.from));
        const to = getOrCreateNftWalletBalance(ctx, nft, getOrCreateWallet(ctx, event.to));
        if (toDate(from.updatedAt) <= toDate(event.timestamp)) {
          if (from.balance < event.value) {
            from.balance = 0n;
          } else {
            from.balance -= event.value;
          }
          from.updatedAt = toDate(event.timestamp);
          ctx.entities.add(from);
        }
        if (toDate(to.updatedAt) <= toDate(event.timestamp)) {
          to.balance += event.value;
          to.updatedAt = toDate(event.timestamp);
          ctx.entities.add(to);
        }
      }
    }
  }
};
