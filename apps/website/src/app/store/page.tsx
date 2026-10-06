import { stripeStoreRuntime } from "@/lib/store/stripe/runtime";
import { getPlayerAccount } from "@/lib/player/server";
import type { Metadata } from "next";
import EvorosStore from "@/components/store/evoros-store";

export const metadata: Metadata = {
  title: "Evoros Store",
  description:
    "Choose Evoros bundles for the EvoVerses in-game shop. Pay with EVO or by card when purchases open.",
  alternates: { canonical: "/store" },
};
export default async function StorePage() {
  const account = await getPlayerAccount();
  let sandboxCheckoutReady = false;
  try {
    sandboxCheckoutReady = Boolean(stripeStoreRuntime());
  } catch {
    // Leave buying disabled if local sandbox configuration is unavailable.
  }
  return (
    <EvorosStore
      sandboxCheckoutReady={sandboxCheckoutReady}
      playerAccount={
        account
          ? {
              displayName: account.player.displayName,
              evoros: account.balance.evoros,
            }
          : undefined
      }
    />
  );
}
