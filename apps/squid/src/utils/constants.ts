import type { IsolationLevel } from "@subsquid/typeorm-store";
import type { ClientConfig } from "pg";
import { events as erc1155Events } from "../abi/erc1155";
import { events as erc721Events } from "../abi/erc721";
import { events as marketplaceEvents } from "../abi/marketplaceV3";
import { getEnv, parseCsv } from "./index";

export const RPC_RATE_LIMIT = Number(getEnv("RATE_LIMIT", 100));
export const RPC_MAX_BATCH_CALL_SIZE = Number(getEnv("MAX_BATCH_SIZE", 100));
export const RPC_CAPACITY = Number(getEnv("RPC_CAPACITY", 100));

// Processor Config
export const CHAIN_ID = getEnv("CHAIN_ID");
export const MARKETPLACE_ADDRESSES = parseCsv(getEnv("MARKETPLACE_ADDRESSES"));
export const NFT_ADDRESSES = parseCsv(getEnv("NFT_ADDRESSES"));
const gatewayNetworkSlugs = parseCsv(getEnv("GATEWAY_NETWORK_SLUGS"));
const gatewayNetworkSlug = getEnv("GATEWAY_NETWORK_SLUG", "").toLowerCase();
export const GATEWAY_URL = getEnv(
  "GATEWAY_URL",
  gatewayNetworkSlug
    ? `${getEnv("GATEWAY_BASE_URL", "https://v2.archive.subsquid.io/network")}/${gatewayNetworkSlug}`
    : undefined,
) as string;

const stateSchemaSuffix = getEnv("STATE_SCHEMA_SUFFIX") ? `_${getEnv("STATE_SCHEMA_SUFFIX")}` : "";
const stateSchema = gatewayNetworkSlug
  ? `squid_processor_${gatewayNetworkSlug.replace("-", "_")}`
  : `squid_processor`;
export const SQUID_STATE_SCHEMA = stateSchema + stateSchemaSuffix;
export const SQUID_STATE_SCHEMAS = gatewayNetworkSlugs.map(slug => `squid_processor_${slug.replace("-", "_")}`);

export const IPFS_GATEWAY = getEnv("IPFS_GATEWAY", "https://ipfs.io/ipfs").replace(/\/?$/, "/");

export const MULTICALL3_ADDRESS = "0xcA11bde05977b3631167028862bE2a173976CA11";

export const METADATA_QUEUE_URL = getEnv("METADATA_QUEUE_URL");

const dbIsolationLevel = getEnv<IsolationLevel>("DB_ISOLATION_LEVEL", "SERIALIZABLE");
export const DB_ISOLATION_LEVEL: IsolationLevel = [ "SERIALIZABLE", "READ COMMITTED", "REPEATABLE READ" ].includes(
  dbIsolationLevel) ? dbIsolationLevel as IsolationLevel : "SERIALIZABLE";

export const DEVELOPMENT = getEnv("NODE_ENV") === "development";

// Processor Topics
export const watchedSharedTopics = [
  marketplaceEvents.ContractURIUpdated.topic,
];
export const watchedNftTopics = [
  erc721Events.Transfer.topic,
  erc721Events.ConsecutiveTransfer.topic,
  erc721Events.BatchMetadataUpdate.topic,
  erc1155Events.TransferSingle.topic,
  erc1155Events.TransferBatch.topic,
  erc1155Events.MetadataUpdate.topic,
  erc1155Events.BatchMetadataUpdate.topic,
  ...watchedSharedTopics,
];
export const watchedMarketplaceTopics = [
  marketplaceEvents.NewAuction.topic,
  marketplaceEvents.AuctionClosed.topic,
  marketplaceEvents.CancelledAuction.topic,
  marketplaceEvents.NewBid.topic,
  marketplaceEvents.NewListing.topic,
  marketplaceEvents.UpdatedListing.topic,
  marketplaceEvents.CancelledListing.topic,
  marketplaceEvents.CurrencyApprovedForListing.topic,
  marketplaceEvents.BuyerApprovedForListing.topic,
  marketplaceEvents.NewOffer.topic,
  marketplaceEvents.AcceptedOffer.topic,
  marketplaceEvents.CancelledOffer.topic,
  marketplaceEvents.NewSale.topic,
  marketplaceEvents.RoleGranted.topic,
  marketplaceEvents.RoleRevoked.topic,
  ...watchedSharedTopics,
];

export const RPC_URLS: Record<string, string> = {
  "43114": "https://api.avax.network/ext/bc/C/rpc",
};

export const EXPLORER_DOMAINS: Record<string, string> = {
  "43114": "snowscan.xyz",
};

export const DATABASE_CONFIG: ClientConfig = {
  host: getEnv("DB_HOST", "localhost"),
  port: parseInt(getEnv("DB_PORT", "5432")),
  database: getEnv("DB_NAME", "postgres"),
  user: getEnv("DB_USER", "postgres"),
  password: getEnv("DB_PASS", "postgres"),
  ...(
    getEnv("DB_SSL", "false").toLowerCase() === "true" ? {
      ssl: { rejectUnauthorized: false },
    } : {}
  ),
};
