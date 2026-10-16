import { stripeStoreRuntime } from "@/lib/store/stripe/runtime";
import { getPlayerAccount } from "@/lib/player/server";
import type { Metadata } from "next";
import EvorosStore from "@/components/store/evoros-store";

export const metadata: Metadata = {
  title: "Evoros Store",
  description:
    "Choose Evoros bundles for the EvoVerses in-game shop. Pay with EVO or by card.",
  alternates: { canonical: "/store" },
};
export default async function StorePage() {
  const account = await getPlayerAccount();
  let cardCheckoutReady = false;
  let cardLive = false;
  try {
    const checkout = stripeStoreRuntime();
    cardCheckoutReady = Boolean(checkout);
    cardLive = Boolean(checkout?.config.live);
  } catch {
    // Keep checkout closed until matching credentials and prices are configured.
  }
  return (
    <EvorosStore
      cardCheckoutReady={cardCheckoutReady}
      cardLive={cardLive}
      playerAccount={
        account
          ? {
              id: account.player.id,
              displayName: account.player.displayName,
              evoros: account.balance.evoros,
            }
          : undefined
      }
    />
  );
}
