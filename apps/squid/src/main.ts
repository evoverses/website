import { TypeormDatabase, TypeormDatabaseOptions } from "@subsquid/typeorm-store";
import { DB_ISOLATION_LEVEL, SQUID_STATE_SCHEMA } from "./utils/constants";
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
  Wallet, Marketplace, MarketplaceAsset, MarketplaceAdmin, MarketplaceLister,
} from "./model";
import { processor } from "./processor";
import { Context } from "./model/context";
import { EntityManager } from "./model/entity-manager";

let chain: Chain;

const options: TypeormDatabaseOptions = {
  supportHotBlocks: true,
  stateSchema: SQUID_STATE_SCHEMA,
  isolationLevel: DB_ISOLATION_LEVEL,
};

processor.run(new TypeormDatabase(options), async context => {

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

  await loadNftEntities(ctx);
  await loadMarketplaceEntities(ctx);
  await loadSharedEntities(ctx);

  processNftEvents(ctx, nftEvents);
  processMarketplaceEvents(ctx, marketplaceEvents);
  processSharedEvents(ctx, sharedEvents);

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
  );

  if (context.isHead) {
    // Cleanup Contracts
    // Cleanup Owners
  }

});
