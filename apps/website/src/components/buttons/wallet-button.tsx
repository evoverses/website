"use client";

import { evoContractAddress } from "@/data/addresses";
import {
  appMetadata,
  chain,
  client,
  supportedNFTs,
  supportedTokens,
  walletConnect,
  wallets,
} from "@/lib/thirdweb/config";
import { auth } from "@/lib/thirdweb/siwe";
import { Button } from "@workspace/ui/components/button";
import type { ComponentProps } from "react";
import { ConnectButton } from "thirdweb/react";
import { useMediaQuery } from "usehooks-ts";

const WalletButton = ({ className, ...props }: ComponentProps<typeof Button>) => {
  const small = useMediaQuery("(max-width: 768px)");
  return (
    <ConnectButton
      client={client}
      wallets={wallets}
      chain={chain}
      auth={auth}
      appMetadata={appMetadata}
      connectModal={{
        size: small ? "compact" : "wide",
        showThirdwebBranding: false,
        privacyPolicyUrl: "/privacy",
        termsOfServiceUrl: "/terms",
      }}
      detailsButton={{
        displayBalanceToken: {
          [chain.id]: evoContractAddress, // token address to display balance for
        },
      }}
      supportedTokens={supportedTokens}
      supportedNFTs={supportedNFTs}
      walletConnect={walletConnect}
    />
  );
};
export { WalletButton };
