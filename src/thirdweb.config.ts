import { createThirdwebClient } from "thirdweb";
import { createWallet, inAppWallet } from "thirdweb/wallets";

const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;
if (!clientId) {
  throw new Error(
    "Missing NEXT_PUBLIC_THIRDWEB_CLIENT_ID env variable. Please add it to your .env.local file.",
  );
}
export const client = createThirdwebClient({
  clientId,
});

export const wallets = [
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
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("io.rabby"),
  createWallet("com.trustwallet.app"),
];

export const recommendedWallets = [
  createWallet("io.metamask"),
]
