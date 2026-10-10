import { FinalizedPortalDatabase } from "./finalized-database";
import { parseNurseryEvents, processNurseryEvents } from "./handlers/asset/nursery";
import { NurseryEvo } from "./model/nurseryEvo.model";
import { TypeormDatabaseOptions } from "@subsquid/typeorm-store";
import { DB_ISOLATION_LEVEL, SQUID_STATE_SCHEMA, NURSERY_CONFIG } from "./utils/constants";
import { loadNftEntities, parseNftEvents, processNftEvents } from "./handlers/asset/nfts";
import { getOrCreateChain } from "./handlers/core/chains";
import { parseBlocks } from "./handlers/core/transactions";
import {
  loadMarketplaceEntities,
  parseMarketplaceEvents,
  processMarketplaceEvents,
} from "./handlers/marketplace/marketplaces";
import { loadSharedEntities, parseSharedEvents, processSharedEvents } from "./handlers/shared";
import {
  EnglishAuction,
  EnglishAuctionBid,
  Block,
  Chain,
  Contract,
  DirectListing,
  NFT,
  NFTWalletBalance,
  Offer,
  DirectListingSale,
  Token,
  Transaction,
  Wallet, Marketplace, MarketplaceAsset, MarketplaceAdmin, MarketplaceLister, BreedingRequest,
} from "./model";
import { dataSource } from "./processor";
import { run } from "@subsquid/batch-processor";
import { augmentBlock } from "@subsquid/evm-objects";
import { createLogger } from "@subsquid/logger";
import { RpcClient } from "@subsquid/rpc-client";
import { CHAIN_ID, RPC_URLS } from "./utils/constants";

const logger = createLogger("sqd:processor:mapping");
const rpcClient = new RpcClient({ url: RPC_URLS[CHAIN_ID!]!, rateLimit: 100, capacity: 10, requestTimeout: 30000 });
import { Context } from "./model/context";
import { EntityManager } from "./model/entity-manager";
import { loadBreedingEntities, parseBreedingEvents, processBreedingEvents } from "./handlers/asset/breeding";

let chain: Chain;

const options: TypeormDatabaseOptions = {
  // Finalized Portal batches may skip empty blocks; preserve the existing state schema.
  supportHotBlocks: false,
  stateSchema: SQUID_STATE_SCHEMA,
  isolationLevel: DB_ISOLATION_LEVEL,
};

run(dataSource, new FinalizedPortalDatabase(options), async simpleContext => {
  const context = { ...simpleContext, blocks: simpleContext.blocks.map(augmentBlock), log: logger, _chain: { client: rpcClient } };

  if (!chain) {
    chain = await getOrCreateChain(context);
  }

  const ctx = new Context(
    new EntityManager(context.store, chain, context.log),
    context.log,
    { blocks: context.blocks, client: context._chain.client },
  );

  const logs = parseBlocks(ctx, context.blocks);

  const nftEvents = parseNftEvents(ctx, logs);
  const marketplaceEvents = parseMarketplaceEvents(ctx, logs);
  const sharedEvents = parseSharedEvents(ctx, logs);
  const breedEvents = parseBreedingEvents(ctx, logs);
  const nurseryEvents = parseNurseryEvents(logs, NURSERY_CONFIG);

  await loadNftEntities(ctx);
  await loadMarketplaceEntities(ctx);
  await loadSharedEntities(ctx);
  await loadBreedingEntities(ctx);

  processNftEvents(ctx, nftEvents);
  processMarketplaceEvents(ctx, marketplaceEvents);
  processSharedEvents(ctx, sharedEvents);
  processBreedingEvents(ctx, breedEvents);
  await processNurseryEvents(ctx, nurseryEvents, NURSERY_CONFIG);

  // The order here is important.
  // - Blocks, Wallets, and Contracts require only Chain foreign keys
  // - Tokens, and NFTs require Contract foreign keys
  // - Transactions require Block & Wallet foreign keys
  // - Auctions, Listings, and Offers require most foreign keys
  // - Bids require Auctions, and Sales require Listings

  await ctx.entities.save(
    Block,
    Wallet,
    Contract,
    Marketplace,
    Token,
    NFT,
    Transaction,
    NFTWalletBalance,
    Offer,
    EnglishAuction,
    DirectListing,
    EnglishAuctionBid,
    DirectListingSale,
    MarketplaceAsset,
    MarketplaceAdmin,
    MarketplaceLister,
    BreedingRequest,
    NurseryEvo
  );

  if (context.isHead) {
    // Cleanup Contracts
    // Cleanup Owners
  }

});
