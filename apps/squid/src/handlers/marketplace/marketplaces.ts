import { MARKETPLACE_ADDRESSES } from "../../constants";
import { Contract, Marketplace } from "../../model";
import type { Log } from "../../types/processor";
import type { Context } from "../../utils/context";
import { loadEnglishAuctionEntities, parseEnglishAuctionEvents, processEnglishAuctionEvents } from "./auctions";
import { loadDirectListingEntities, parseDirectListingEvents, processDirectListingEvents } from "./listings";
import { loadOfferEntities, parseOfferEvents, processOfferEvents } from "./offers";
import { loadRoleEntities, parseRoleEvents, processRoleEvents } from "./roles";

export const getOrCreateMarketplace = (ctx: Context, contract: Contract) => {
  if (!MARKETPLACE_ADDRESSES.includes(contract.address.toLowerCase())) {
    throw new Error(`Marketplace contract ${contract.address} is not supported!`);
  }
  const id = contract.id;
  let marketplace = ctx.entities.get(Marketplace, id, false);
  if (!marketplace) {
    marketplace = new Marketplace({ id, contract });
    ctx.entities.add(marketplace);
  }
  return marketplace;
};

export const parseMarketplaceEvents = (ctx: Context, logs: Log[]) => {
  const englishAuctionEvents = parseEnglishAuctionEvents(ctx, logs);
  const directListingEvents = parseDirectListingEvents(ctx, logs);
  const offerEvents = parseOfferEvents(ctx, logs);
  const roleEvents = parseRoleEvents(ctx, logs);
  return { englishAuctionEvents, directListingEvents, offerEvents, roleEvents };
};

export const loadMarketplaceEntities = async (ctx: Context) => {
  await loadEnglishAuctionEntities(ctx);
  await loadDirectListingEntities(ctx);
  await loadOfferEntities(ctx);
  await loadRoleEntities(ctx);
};

export const processMarketplaceEvents = (ctx: Context, events: ReturnType<typeof parseMarketplaceEvents>) => {
  const {
    englishAuctionEvents,
    directListingEvents,
    offerEvents,
    roleEvents,
  } = events;
  processEnglishAuctionEvents(ctx, englishAuctionEvents);
  processDirectListingEvents(ctx, directListingEvents);
  processOfferEvents(ctx, offerEvents);
  processRoleEvents(ctx, roleEvents);
};
