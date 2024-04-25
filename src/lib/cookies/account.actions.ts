"use server";

import { makeAccountCookie } from "@/lib/cookies/account.middleware";
import { getAccountCookie } from "@/lib/cookies/account.server";
import { getAddressSafe } from "@/lib/viem";
import { IAccountCookie } from "@/types/cookies";
import { Address } from "abitype";
import { cookies } from "next/headers";

/** Set the current address of the account in cookieStore
 *
 * @function setAccountCookieAddressAction
 * @param {Address} address - Wallet address of the account
 * @returns {Promise<void>} - void
 */
export const setAccountCookieAddressAction = async (address: Address): Promise<void> => {
  if (getAddressSafe(address) && getAccountCookie().address !== address) {
    cookies().set(makeAccountCookie({
      ...getAccountCookie(),
      address,
    }));
  }
};

export const setAccountCookieSessionTicketAction = async (sessionTicket: string): Promise<void> => {
  if (sessionTicket !== getAccountCookie().sessionTicket) {
    cookies().set(makeAccountCookie({
      ...getAccountCookie(),
      sessionTicket,
    }));
  }
};

/** Get the account cookie via a server action
 *
 * @function getAccountCookieAction
 * @returns {Promise<IAccountCookie>} - Account Cookie
 */
export const getAccountCookieAction = async (): Promise<IAccountCookie> => {
  return getAccountCookie();
};
