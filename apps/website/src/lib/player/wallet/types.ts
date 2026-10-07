export type WalletLink = {
  id: string;
  chainId: 43114;
  addressLabel: string;
  matchesConnected: boolean;
  verifiedAt: string;
};
export type WalletLinkStatus = { links: WalletLink[] };
export type WalletLinkChallenge = {
  challengeId: string;
  message: string;
  expiresAt: string;
};
