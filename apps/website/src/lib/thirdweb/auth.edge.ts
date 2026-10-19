"use server";

import { localWalletPreview } from "./preview";
import { clientId } from "./env.client";
import { adminPrivateKey } from "@/lib/thirdweb/env";
import { authDomain } from "@/lib/thirdweb/env.client";
import { assertEnvNotNull } from "@/utils/node";
import type { RequestCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { createThirdwebClient } from "thirdweb";
import { createAuth } from "thirdweb/auth";
import type { JWTPayload } from "thirdweb/utils";
import { privateKeyToAddress } from "viem/accounts";

// Construct the configured verifier only when a wallet cookie needs checking.
let configuredAuth: ReturnType<typeof createAuth> | undefined;
const getAuth = () => configuredAuth ??= createAuth({
  domain: authDomain,
  client: createThirdwebClient(process.env.THIRDWEB_SECRET_KEY
    ? { secretKey: process.env.THIRDWEB_SECRET_KEY } : { clientId }),
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
  if (localWalletPreview) return { valid: false, parsedJWT: {} as JWTPayload };
  let jwt = "";
  if (typeof cookie === "string") {
    jwt = cookie;
  } else if (cookie) {
    jwt = cookie.value;
  } else {
    return { valid: false, parsedJWT: {} as JWTPayload };
  }
  // A stale wallet cookie must never prevent public pages from rendering.
  // Missing legacy signer configuration is an unauthenticated wallet, not a login.
  if (!jwt || jwt.length > 8192 || !adminPrivateKey) {
    return { valid: false, parsedJWT: {} as JWTPayload };
  }
  try {
    return await getAuth().verifyJWT({ jwt });
  } catch {
    // Invalid/expired cookies and verifier failures cannot establish identity.
    return { valid: false, parsedJWT: {} as JWTPayload };
  }
};
