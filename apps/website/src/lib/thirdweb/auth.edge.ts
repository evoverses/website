"use server";

import { adminPrivateKey } from "@/lib/thirdweb/env";
import { authDomain } from "@/lib/thirdweb/env.client";
import { assertEnvNotNull } from "@/utils/node";
import type { RequestCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { createThirdwebClient } from "thirdweb";
import { createAuth } from "thirdweb/auth";
import type { JWTPayload } from "thirdweb/utils";
import { privateKeyToAddress } from "viem/accounts";

// stripped down auth to allow edge import
const auth = createAuth({
  domain: authDomain,
  client: createThirdwebClient({ secretKey: process.env.THIRDWEB_SECRET_KEY! }),
  adminAccount: {
    address: privateKeyToAddress(assertEnvNotNull(adminPrivateKey, "THIRDWEB_ADMIN_PRIVATE_KEY") as `0x${string}`),
    sendTransaction: () => {
      return {} as Promise<{ readonly transactionHash: `0x${string}`; }>;
    },
    signMessage: () => {
      return {} as Promise<`0x${string}`>;
    },
    signTypedData: () => {
      return {} as Promise<`0x${string}`>;
    },
  },
});

export const verifyAuthCookie = async (cookie: string | RequestCookie | undefined) => {
  let jwt = "";
  if (typeof cookie === "string") {
    jwt = cookie;
  } else if (cookie) {
    jwt = cookie.value;
  } else {
    return { valid: false, parsedJWT: {} as JWTPayload };
  }
  return auth.verifyJWT({ jwt });
};
