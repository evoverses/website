"use client";
import { useProMode } from "@/components/providers/pro-mode-provider";
import { walletConnectionAvailable } from "@/lib/thirdweb/preview";
import { appMetadata, chain, chainWallets, client } from "@/lib/thirdweb/config";
import { AutoConnect } from "thirdweb/react";

// Reconnect only wallets previously authorised by the browser user.
export function ExternalWalletAutoConnect() {
  const { proMode } = useProMode();
  return proMode && walletConnectionAvailable ? <AutoConnect client={client} chain={chain} wallets={chainWallets} appMetadata={appMetadata} timeout={5_000} /> : null;
}
