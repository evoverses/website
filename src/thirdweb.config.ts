import { createThirdwebClient } from "thirdweb";
import { avalanche } from "thirdweb/chains";
import { createWallet, inAppWallet, type SmartWalletOptions } from "thirdweb/wallets";

const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;
const secretKey = process.env.THIRDWEB_SECRET_KEY;
if (!clientId) {
  throw new Error(
    "Missing NEXT_PUBLIC_THIRDWEB_CLIENT_ID env variable. Please add it to your .env.local file.",
  );
}
export const client = createThirdwebClient({
  clientId,
});

export const chain = avalanche;

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

export const accountAbstraction: SmartWalletOptions = {
  chain,
  sponsorGas: false,
};

export const walletConnect = {
  projectId: process.env.NEXT_PUBLIC_THIRDWEB_PROJECT_ID,
};
