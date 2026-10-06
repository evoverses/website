import { appMetadata, chain, chainWallets, client, walletConnect } from "./config";
import { darkTheme, type UseConnectModalOptions } from "thirdweb/react";

/** External wallets only; no account abstraction or wallet-based game login. */
export function chainConnectionOptions(): UseConnectModalOptions {
  return {
    client, chain, chains: [chain], wallets: chainWallets, walletConnect,
    appMetadata, showAllWallets: false,
    theme: darkTheme({ colors: { modalBg: "var(--background)" } }),
    showThirdwebBranding: false, size: "compact", title: "Connect your wallet",
    titleIcon: "/icon.png", termsOfServiceUrl: "/terms", privacyPolicyUrl: "/privacy",
  };
}
