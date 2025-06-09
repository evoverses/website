import { evoContractAddress, evoNftContractAddress } from "@/data/addresses";
import { createThirdwebClient, defineChain } from "thirdweb";
import { arbitrum, avalanche, base, ethereum, optimism, polygon, polygonZkEvm, zora } from "thirdweb/chains";
import type { SupportedTokens } from "thirdweb/react";
import { createWallet, inAppWallet, type SmartWalletOptions } from "thirdweb/wallets";
import { sei, soneium } from "viem/chains";

const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;
const secretKey = process.env.THIRDWEB_SECRET_KEY;
if (!clientId) {
  throw new Error(
    "Missing NEXT_PUBLIC_THIRDWEB_CLIENT_ID env variable. Please add it to your .env.local file.",
  );
}
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
  soneium,
  zora,
  defineChain(sei as Parameters<typeof defineChain>[0]),
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
export const wallets = [
  ...socialWallets,
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("io.rabby"),
  createWallet("com.trustwallet.app"),
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
