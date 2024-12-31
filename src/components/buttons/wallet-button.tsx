"use client";

import { Button } from "@/components/ui/button";
import { chain, evoContract, evoNftContract } from "@/data/contracts";
import { client, recommendedWallets, wallets } from "@/thirdweb.config";
import type { ComponentProps } from "react";
import type { Address } from "thirdweb";
import { ConnectButton } from "thirdweb/react";
import { useMediaQuery } from "usehooks-ts";

const WalletButton = ({ className, ...props }: ComponentProps<typeof Button>) => {
  const small = useMediaQuery("(max-width: 768px)");
  return (
    <ConnectButton
      client={client}
      recommendedWallets={recommendedWallets}
      wallets={wallets}
      chain={chain}
      appMetadata={{
        name: "EvoVerses",
        url: "https://evoverses.com",
        description: "A 3D monster battling game bringing Web2 and Web3 together in one platform.",
        logoUrl: "https://evoverses.com/EVO.png",
      }}
      connectModal={{
        size: small ? "compact" : "wide",
        showThirdwebBranding: false,
        privacyPolicyUrl: "https://evoverses.com/privacy",
      }}
      detailsButton={{
        displayBalanceToken: {
          [chain.id]: evoContract.address, // token address to display balance for
        },
      }}
      supportedTokens={{
        [chain.id]: [
          {
            address: evoContract.address,
            name: "EVO",
            symbol: "EVO",
            icon: "https://evoverses.com/EVO.png",
          },
          {
            address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
            name: "USDC",
            symbol: "USDC",
            icon: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png?v=040",
          },
          {
            address: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7",
            name: "USDT",
            symbol: "USDT",
            icon: "https://cryptologos.cc/logos/tether-usdt-logo.png?v=040",
          },
          {
            address: "0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7",
            name: "WAVAX",
            symbol: "WAVAX",
            icon: "https://cryptologos.cc/logos/avalanche-avax-logo.png?v=040",
          },
        ],
      }}
      supportedNFTs={{
        [chain.id]: [ evoNftContract.address as Address ],
      }}
      walletConnect={{
        projectId: process.env.NEXT_PUBLIC_THIRDWEB_PROJECT_ID,
      }}
    />
  );
};
export { WalletButton };
