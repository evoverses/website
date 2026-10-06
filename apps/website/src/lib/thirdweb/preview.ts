/** UI preview only. Never enable this in a production build. */
export const localWalletPreview = process.env.NODE_ENV === "development"
  && process.env.NEXT_PUBLIC_EVOVERSES_LOCAL_WALLET_PREVIEW === "1";

// A real public client ID can enable direct wallet connection while legacy
// wallet authentication stays disabled in the local preview.
export const walletConnectionAvailable = /^[a-f0-9]{32}$/i.test(process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "")
  && process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID !== "0123456789abcdef0123456789abcdef";
