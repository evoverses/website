"use server";
import { DeadBeef } from "@/data/constants";
import { client } from "@/thirdweb.config";
import { cookies } from "next/headers";
import type { Address } from "thirdweb";
import { createAuth, type GenerateLoginPayloadParams, type VerifyLoginPayloadParams } from "thirdweb/auth";
import { privateKeyToAccount } from "thirdweb/wallets";
import { verifyAuthCookie } from "./auth.edge";

const authCookieKey = "ev:jwt" as const;
const privateKey = process.env.THIRDWEB_ADMIN_PRIVATE_KEY || "";

if (!privateKey) {
  throw new Error("Missing THIRDWEB_ADMIN_PRIVATE_KEY in .env file.");
}

const domain = process.env.NEXT_PUBLIC_THIRDWEB_AUTH_DOMAIN || "";

if (!domain) {
  throw new Error("Missing NEXT_PUBLIC_THIRDWEB_AUTH_DOMAIN in .env file.");
}

const auth = createAuth({ domain, adminAccount: privateKeyToAccount({ client, privateKey }) });

export const generatePayload = async (params: GenerateLoginPayloadParams) => auth.generatePayload({
  ...params,
  chainId: 43114,
});

export const login = async (payload: VerifyLoginPayloadParams) => {
  const verifiedPayload = await auth.verifyPayload(payload);
  if (verifiedPayload.valid) {
    const jwt = await auth.generateJWT({
      payload: verifiedPayload.payload,
    });
    const cookieStore = await cookies();
    cookieStore.set(authCookieKey, jwt);
  }
};

export const isLoggedIn = async () => {
  const cookie = await getAuthCookie();
  return cookie !== false;
};

export const logout = async () => {
  const cookieStore = await cookies();
  cookieStore.delete(authCookieKey);
};

export const getAuthCookie = async () => {
  const cookieStore = await cookies();
  const jwt = cookieStore.get(authCookieKey);
  if (jwt && jwt.value) {
    const authResult = await verifyAuthCookie(jwt);
    if (authResult.valid) {
      return authResult.parsedJWT;
    }
  }
  return false;
};

export const getAuthCookieAddress = async () => {
  const cookie = await getAuthCookie();
  return cookie ? cookie.sub as Address : DeadBeef;
};
