import {
  evoContractAddress,
  evoNftContractAddress,
  usdcContractAddress,
  usdtContractAddress,
  wavaxContractAddress,
} from "@/data/addresses";
import { secretKey } from "@/lib/thirdweb/env";
import { clientId } from "@/lib/thirdweb/env.client";
import { createThirdwebClient, defineChain } from "thirdweb";
import { arbitrum, avalanche, base, ethereum, optimism, polygon, polygonZkEvm, zora } from "thirdweb/chains";
import type { SupportedTokens } from "thirdweb/react";
import { createWallet, inAppWallet, type SmartWalletOptions } from "thirdweb/wallets";
import { sei, soneium } from "viem/chains";


export const client = createThirdwebClient(secretKey ? { secretKey } : { clientId });

export const chain = avalanche;

export const chains = [
  avalanche,
  ethereum,
  base,
  arbitrum,
  optimism,
  polygon,
  polygonZkEvm,
  zora,
  defineChain(sei as Parameters<typeof defineChain>[0]),
  defineChain(soneium as Parameters<typeof defineChain>[0]),
];

export const socialWallets = [
  inAppWallet({
    auth: {
      options: [
        "google",
        "discord",
        "telegram",
        "farcaster",
        "email",
        "x",
        "passkey",
        "phone",
        "twitch",
        "github",
        "steam",
        "coinbase",
        "apple",
        "facebook",
        "line",
      ],
    },
  }),
];

export const chainWallets = [
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("io.rabby"),
  createWallet("com.trustwallet.app"),
]

export const wallets = [
  ...socialWallets,
  ...chainWallets,
];

export const appMetadata = {
  name: "EvoVerses",
  url: "https://evoverses.com",
  description: "A 3D monster battling game bringing Web2 and Web3 together in one platform.",
  logoUrl: "https://evoverses.com/EVO.png",
};

export const supportedTokens: SupportedTokens = {
  [chain.id]: [
    {
      address: evoContractAddress,
      name: "EVO",
      symbol: "EVO",
      icon: "https://evoverses.com/EVO.png",
    },
    {
      address: usdcContractAddress,
      name: "USDC",
      symbol: "USDC",
      icon: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png?v=040",
    },
    {
      address: usdtContractAddress,
      name: "USDT",
      symbol: "USDT",
      icon: "https://cryptologos.cc/logos/tether-usdt-logo.png?v=040",
    },
    {
      address: wavaxContractAddress,
      name: "WAVAX",
      symbol: "WAVAX",
      icon: "https://cryptologos.cc/logos/avalanche-avax-logo.png?v=040",
    },
  ],
};

export const supportedNFTs = {
  [chain.id]: [ evoNftContractAddress ],
};
export const accountAbstraction: SmartWalletOptions = {
  chain,
  sponsorGas: false,
};

export const walletConnect = {
  projectId: process.env.NEXT_PUBLIC_THIRDWEB_PROJECT_ID,
};
