import "server-only";
import Stripe from "stripe";
import { stripeStoreConfig } from "./config";
import type { StripeGateway } from "./core";
import { getStorePlayerService } from "./player-service";

export function stripeStoreRuntime() {
  const config = stripeStoreConfig(process.env);
  const players = getStorePlayerService();
  if (!config || !players) return null;
  const sdk = new Stripe(config.secretKey, {
    maxNetworkRetries: 2,
    timeout: 15_000,
  });
  const gateway: StripeGateway = {
    retrievePrice: (id) => sdk.prices.retrieve(id),
    createSession: (params, options) =>
      sdk.checkout.sessions.create(params, options),
    retrieveSession: (id) => sdk.checkout.sessions.retrieve(id),
    listLineItems: (id) =>
      sdk.checkout.sessions.listLineItems(id, { limit: 2 }),
  };
  return { config, players, sdk, gateway };
}
