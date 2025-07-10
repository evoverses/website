import { events as directListingEvents, functions as directListingFunctions } from "./generated/direct-listings";
import { events as englishAuctionEvents, functions as englishAuctionFunctions } from "./generated/english-auctions";
import { events as entrypointEvents, functions as entrypointFunctions } from "./generated/marketplace-entrypoint";
import { events as offerEvents, functions as offerFunctions } from "./generated/offers";

const events = {
  ...entrypointEvents,
  ...directListingEvents,
  ...offerEvents,
  ...englishAuctionEvents,
};

const functions = {
  ...entrypointFunctions,
  ...directListingFunctions,
  ...offerFunctions,
  ...englishAuctionFunctions,
};

export {
  entrypointEvents,
  directListingEvents,
  offerEvents,
  englishAuctionEvents,
  entrypointFunctions,
  directListingFunctions,
  offerFunctions,
  englishAuctionFunctions,
  events,
  functions,
};
