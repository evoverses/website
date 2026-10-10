import { events as nurseryEvents } from "./abi/generated/hatcher-hermann";
import { DataSourceBuilder, type FieldSelection } from "@subsquid/evm-stream";
import { CHAIN_ID, MARKETPLACE_ADDRESSES, NFT_ADDRESSES, watchedMarketplaceTopics, watchedNftTopics, NURSERY_CONFIG } from "./utils/constants";

export const fields = {
  block: { timestamp: true },
  log: { address: true, topics: true, data: true, transactionHash: true },
  transaction: { hash: true, from: true, status: true },
} as const satisfies FieldSelection;

export function buildDataSource() {
  if (CHAIN_ID !== "43114") throw new Error("Portal migration currently supports Avalanche C-chain only");
  const builder = new DataSourceBuilder()
    .setPortal(process.env.PORTAL_URL || "https://portal.sqd.dev/datasets/avalanche-mainnet")
    .addLog({ where: { address: MARKETPLACE_ADDRESSES, topic0: watchedMarketplaceTopics }, include: { transaction: true } })
    .addLog({ where: { address: NFT_ADDRESSES, topic0: watchedNftTopics }, include: { transaction: true } })
    .setFields(fields);
  if (NURSERY_CONFIG) builder.addLog({ where: { address: [NURSERY_CONFIG.hatcher], topic0: Object.values(nurseryEvents).map(event => event.topic) }, include: { transaction: true }, range: { from: NURSERY_CONFIG.fromBlock } });
  return builder.build();
}
export const dataSource = buildDataSource();
