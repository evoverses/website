"use server";

import { DeadBeef } from "@/data/constants";
import { client } from "@/lib/thirdweb/config";
import { adminPrivateKey } from "@/lib/thirdweb/env";
import { authDomain } from "@/lib/thirdweb/env.client";
import { assertEnvNotNull } from "@/utils/node";
import { cookies } from "next/headers";
import type { Address } from "thirdweb";
import { createAuth, type GenerateLoginPayloadParams, type VerifyLoginPayloadParams } from "thirdweb/auth";
import { privateKeyToAccount } from "thirdweb/wallets";
import { verifyAuthCookie } from "./auth.edge";

const authCookieKey = "ev:jwt" as const;

const auth = createAuth({
  client,
  domain: authDomain,
  adminAccount: privateKeyToAccount({
    client,
    privateKey: assertEnvNotNull(adminPrivateKey, "THIRDWEB_ADMIN_PRIVATE_KEY"),
  }),
});

export const generatePayload = async (params: GenerateLoginPayloadParams) => {
  // console.log(`generatePayload::params::`, params);
  const payload = await auth.generatePayload({
    ...params,
    chainId: 43114,
  });
  // console.log(`generatePayload::payload::`, payload);
  return payload;
};

export const login = async (payload: VerifyLoginPayloadParams) => {
  const verifiedPayload = await auth.verifyPayload(payload);
  // console.log(`login::verifiedPayload::${verifiedPayload}`);
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
  // console.log("isLoggedIn:", cookie);
  return cookie !== false;
};

export const logout = async () => {
  // console.log("logout");
  const cookieStore = await cookies();
  cookieStore.delete(authCookieKey);
};

export const getAuthCookie = async () => {
  const cookieStore = await cookies();
  const jwt = cookieStore.get(authCookieKey);
  // console.log("getAuthCookie", jwt);
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
