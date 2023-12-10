"use server";

import { DefaultAccountCookie } from "@/data/constants";
import { getAddressSafe } from "@/lib/viem";
import { IAccountCookie } from "@/types/cookies";
import { Address } from "abitype";
import { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { cookies } from "next/headers";

const makeAccountCookie = (accountCookie: IAccountCookie): ResponseCookie => {
  return {
    name: "ev-account",
    value: btoa(JSON.stringify(accountCookie)),
    httpOnly: true,
    path: "/",
    maxAge: 86_400,
  };
};

/** Get the current trade state from cookie storage
 *
 * @function getAccountCookie
 * @returns {IAccountCookie} - TradeCookie
 */
export const getAccountCookie = (): IAccountCookie => {
  const accountCookie = cookies().get("ev-account");
  if (accountCookie) {
    const cookie = JSON.parse(atob(accountCookie.value));
    if (process.env.IMPERSONATE === "true" && getAddressSafe(process.env.IMPERSONATE_ADDRESS) && cookie.loggedIn) {
      cookie.address = process.env.IMPERSONATE_ADDRESS;
    }
    return { ...DefaultAccountCookie, ...cookie };
  }

  return DefaultAccountCookie;
};
/** Set the current address of the account in cookieStore
 *
 * @function setAccountCookieAddress
 * @param {Address} address - Wallet address of the account
 * @returns {Promise<void>} - void
 */
export const setAccountCookieAddress = async (address: Address): Promise<void> => {
  cookies().set(makeAccountCookie({
    ...getAccountCookie(),
    address,
    loggedIn: address !== DefaultAccountCookie.address,
  }));
};

export const setAccountCookieSessionTicket = async (sessionTicket: string): Promise<void> => {
  cookies().set(makeAccountCookie({
    ...getAccountCookie(),
    sessionTicket,
  }));
};
