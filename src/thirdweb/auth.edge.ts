"use server";
import type { RequestCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { type Address, createThirdwebClient } from "thirdweb";
import { createAuth } from "thirdweb/auth";
import type { JWTPayload } from "thirdweb/utils";
import { privateKeyToAddress } from "viem/accounts";

const authCookieKey = "ev:jwt" as const;

const privateKey = process.env.THIRDWEB_ADMIN_PRIVATE_KEY as Address | undefined;

if (!privateKey) {
  throw new Error("Missing THIRDWEB_ADMIN_PRIVATE_KEY in .env file.");
}

const domain = process.env.NEXT_PUBLIC_THIRDWEB_AUTH_DOMAIN || "";

if (!domain) {
  throw new Error("Missing NEXT_PUBLIC_THIRDWEB_AUTH_DOMAIN in .env file.");
}

// stripped down auth to allow edge import
const auth = createAuth({
  domain,
  client: createThirdwebClient({ secretKey: process.env.THIRDWEB_SECRET_KEY! }),
  adminAccount: {
    address: privateKeyToAddress(privateKey),
    sendTransaction: () => {
      return {} as any;
    },
    signMessage: () => {
      return {} as any;
    },
    signTypedData: () => {
      return {} as any;
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
