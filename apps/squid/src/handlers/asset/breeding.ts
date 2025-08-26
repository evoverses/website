import { events } from "../../abi/generated/breeder-brenda";
import type { Context } from "../../model/context";
import type { BreedMintedEventData, BreedRequestedEventData } from "../../types/nft";
import type { Log } from "../../types/processor";
import { parseLogGenerics } from "../shared";

export const parseNftEvents = (ctx: Context, logs: Log[]) => {
  const breedRequestEvents: BreedRequestedEventData[] = [];
  const breedMintEvents: BreedMintedEventData[] = [];

  for (let log of logs) {
    switch (log.topics[0]) {
      case events.BreedRequested.topic: {
        breedRequestEvents.push(parseBreedRequestedEvent(ctx, log));
        break;
      }
      case events.BreedMinted.topic: {
        return;
      }
    }
  }

  return { breedMintEvents, breedRequestEvents };
};

export const parseBreedRequestedEvent = (ctx: Context, log: Log): BreedRequestedEventData => {
  const { breeder, amountPaid, parent2, parent1 } = events.BreedRequested.decode(log);
  return {
    ...parseLogGenerics(log),
    breeder,
    parent1,
    parent2,
    amountPaid,
  };
};

export const parseBreedMintedEvent = (ctx: Context, log: Log): BreedMintedEventData => {
  const { mintedBy, tokenId, to } = events.BreedMinted.decode(log);
  return {
    ...parseLogGenerics(log),
    mintedBy,
    tokenId,
    to,
  };
};
