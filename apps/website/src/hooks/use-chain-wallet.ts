"use client";
import { useConnectedWallets } from "@/hooks/use-connected-wallets";
import { useActiveAccount } from "thirdweb/react";

/** Use the selected external owner wallet; never substitute a smart/in-app account. */
export function useChainWallet() {
  const active = useActiveAccount();
  const wallets = useConnectedWallets({ includeSmart: false, includeInApp: false });
  const wallet = wallets.find(value => value.getAccount()?.address.toLowerCase() === active?.address.toLowerCase()) ?? wallets[0];
  return { wallet, account: wallet?.getAccount(), wallets };
}
