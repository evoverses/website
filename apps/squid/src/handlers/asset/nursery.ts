import { events } from "../../abi/generated/hatcher-hermann";
import { events as nftEvents } from "../../abi/erc721";
import type { Context } from "../../model/context";
import type { Log } from "../../types/processor";
import { NurseryEvo } from "../../model/nurseryEvo.model";
import type { NurseryConfig } from "../../nursery/config";
import {
  groupRegistryEvents,
  projectSnapshot,
  type RegistryEvent,
  type Snapshot,
} from "../../nursery/projection";
import { registryReader } from "../../nursery/reader";

export function parseNurseryEvents(
  logs: Log[],
  config?: NurseryConfig,
): RegistryEvent[] {
  if (!config) return [];
  const parsed: RegistryEvent[] = [];
  for (const log of logs) {
    if (log.block.height < config.fromBlock) continue;
    const position = {
      height: log.block.height,
      hash: log.block.hash,
      timestamp: log.block.timestamp,
      index: log.logIndex,
    };
    if (
      log.address.toLowerCase() === config.collection &&
      log.topics[0] === nftEvents.MetadataUpdate.topic
    ) {
      parsed.push({
        ...position,
        name: "MetadataUpdate",
        tokenId: nftEvents.MetadataUpdate.decode(log)._tokenId,
      });
    } else if (log.address.toLowerCase() === config.hatcher) {
      for (const name of [
        "AdultImported",
        "EggRecorded",
        "EggTreated",
        "HatchRequested",
        "EggHatched",
      ] as const) {
        if (log.topics[0] !== events[name].topic) continue;
        if (name === "EggRecorded") {
          const { tokenId, ...seed } = events.EggRecorded.decode(log);
          parsed.push({ ...position, name, tokenId, seed });
        } else {
          const { tokenId } = events[name].decode(log);
          parsed.push({ ...position, name, tokenId });
        }
      }
    }
  }
  return parsed;
}

/** Read all rows before staging any mutation; Store commits/rolls back with NFT events. */
export async function processNurseryEvents(
  ctx: Context,
  events: RegistryEvent[],
  config?: NurseryConfig,
) {
  if (!config || !events.length) return;
  const groups = groupRegistryEvents(events);
  for (const { tokens } of groups)
    for (const { tokenId } of tokens.values())
      ctx.entities.defer(NurseryEvo, `${config.collection}-${tokenId}`);
  await ctx.entities.load(NurseryEvo);
  const staged = new Map<string, Snapshot>();
  for (const { block, tokens } of groups) {
    const reader = await registryReader(ctx._chain.client, config, block);
    const entries = [...tokens.values()];
    // Bound concurrent RPC work; no collection-wide refresh on a single-token event.
    for (let start = 0; start < entries.length; start += 8) {
      const rows = await Promise.all(
        entries
          .slice(start, start + 8)
          .map(async ({ tokenId, seed, hatchedAt }) => {
            const id = ctx.entities.toId(config.collection, tokenId);
            const previous =
              staged.get(id) ?? ctx.entities.get(NurseryEvo, id, false);
            return projectSnapshot(
              id,
              config.hatcher,
              tokenId,
              block,
              reader,
              previous,
              seed,
              hatchedAt,
            );
          }),
      );
      for (const row of rows) if (row) staged.set(row.id, row);
    }
  }
  for (const row of staged.values()) ctx.entities.add(new NurseryEvo(row));
}
