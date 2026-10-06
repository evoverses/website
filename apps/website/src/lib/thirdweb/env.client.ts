import { assertEnvNotNull } from "@/utils/node";
import { localWalletPreview } from "./preview";

export const authDomain = assertEnvNotNull(
  process.env.NEXT_PUBLIC_THIRDWEB_AUTH_DOMAIN,
  "NEXT_PUBLIC_THIRDWEB_AUTH_DOMAIN",
);

// The placeholder only lets the SDK construct UI objects. Preview mode blocks
// wallet authentication and connection; it is not a genuine Thirdweb client.
export const clientId = assertEnvNotNull(
  process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || (localWalletPreview ? "0123456789abcdef0123456789abcdef" : undefined),
  "NEXT_PUBLIC_THIRDWEB_CLIENT_ID",
);
