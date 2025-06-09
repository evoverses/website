import { events as erc1155Events } from "../../abi/erc1155";
import { events as marketplaceEvents } from "../../abi/marketplaceV3";
import { Contract, Wallet } from "../../model";
import type { Log } from "../../types/processor";
import type { ContractURIUpdatedEventData, LogGenericEventData, OwnerUpdatedEventData } from "../../types/shared";
import { toDate } from "../../utils";
import { Context } from "../../model/context";

export const parseSharedEvents = (ctx: Context, logs: Log[]) => parseEvents(ctx, logs);

export const loadSharedEntities = async (ctx: Context) => {
  await ctx.entities.load(Contract);
};

export const processSharedEvents = (ctx: Context, events: ReturnType<typeof parseSharedEvents>) => {
  processContractURIUpdatedEvents(ctx, events.contractURIUpdatedEvents);
};

const parseEvents = (ctx: Context, logs: Log[]) => {
  const ownerUpdatedEvents: OwnerUpdatedEventData[] = [];
  const contractURIUpdatedEvents: ContractURIUpdatedEventData[] = [];

  for (let log of logs) {
    switch (log.topics[0]) {
      case marketplaceEvents.ContractURIUpdated.topic: {
        contractURIUpdatedEvents.push(parseContractURIUpdatedEvent(ctx, log));
        break;
      }
      case erc1155Events.OwnerUpdated.topic: {
        ownerUpdatedEvents.push(parseOwnerUpdatedEvent(ctx, log));
        break;
      }
    }
  }
  return { ownerUpdatedEvents, contractURIUpdatedEvents };
};

const parseOwnerUpdatedEvent = (ctx: Context, log: Log): OwnerUpdatedEventData => {
  const { prevOwner, newOwner } = erc1155Events.OwnerUpdated.decode(log);
  ctx.entities.defer(Contract, log.address.toLowerCase());
  ctx.entities.defer(Wallet, prevOwner.toLowerCase(), newOwner.toLowerCase());
  return {
    prevOwner: prevOwner.toLowerCase(),
    newOwner: newOwner.toLowerCase(),
    ...parseLogGenerics(log),
  };
};

const parseContractURIUpdatedEvent = (ctx: Context, log: Log): ContractURIUpdatedEventData => {
  const { newURI, prevURI } = marketplaceEvents.ContractURIUpdated.decode(log);
  ctx.entities.defer(Contract, log.address.toLowerCase());
  return {
    prevURI,
    newURI,
    ...parseLogGenerics(log),
  };
};

const processContractURIUpdatedEvents = (ctx: Context, events: ContractURIUpdatedEventData[]) => {
  for (let event of events) {
    const contract = ctx.entities.get(Contract, event.contract, false);
    if (!contract) {
      ctx.log.debug(`ContractURIUpdatedEvents: Skipping unknown contract: ${event.contract}`);
      continue;
    }
    if (toDate(contract.updatedAt) <= event.timestamp && event.prevURI !== event.newURI) {
      contract.uri = event.newURI;
      ctx.entities.add(contract);
    }
  }
};

export const parseLogGenerics = (log: Log): LogGenericEventData => (
  {
    contract: log.address.toLowerCase(),
    blockNumber: log.block.height,
    timestamp: toDate(log.block.timestamp),
    txHash: log.transactionHash,
  }
);
