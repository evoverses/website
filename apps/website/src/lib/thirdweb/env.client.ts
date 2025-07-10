import { assertEnvNotNull } from "@/utils/node";

export const authDomain = assertEnvNotNull(
  process.env.NEXT_PUBLIC_THIRDWEB_AUTH_DOMAIN,
  "NEXT_PUBLIC_THIRDWEB_AUTH_DOMAIN",
);

export const clientId = assertEnvNotNull(
  process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
  "NEXT_PUBLIC_THIRDWEB_CLIENT_ID",
);
