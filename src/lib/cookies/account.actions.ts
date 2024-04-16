"use server";

import { DefaultAccountCookie } from "@/data/constants";
import { getAccountCookie } from "@/lib/cookies/account.server";
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

/** Set the current address of the account in cookieStore
 *
 * @function setAccountCookieAddressAction
 * @param {Address} address - Wallet address of the account
 * @returns {Promise<void>} - void
 */
export const setAccountCookieAddressAction = async (address: Address): Promise<void> => {
  cookies().set(makeAccountCookie({
    ...getAccountCookie(),
    address,
    loggedIn: address !== DefaultAccountCookie.address,
  }));
};

export const setAccountCookieSessionTicketAction = async (sessionTicket: string): Promise<void> => {
  cookies().set(makeAccountCookie({
    ...getAccountCookie(),
    sessionTicket,
  }));
};

/** Get the account cookie via a server action
 *
 * @function getAccountCookieAction
 * @returns {Promise<IAccountCookie>} - Account Cookie
 */
export const getAccountCookieAction = async (): Promise<IAccountCookie> => {
  return getAccountCookie();
};
