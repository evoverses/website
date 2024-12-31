"use server";

import { makeAccountCookie } from "@/lib/cookies/account.middleware";
import { getAccountCookie } from "@/lib/cookies/account.server";
import { getAddressSafe } from "@/lib/viem";
import { cookies } from "next/headers";
import { Address } from "thirdweb";

/** Set the current address of the account in cookieStore
 *
 * @function setAccountCookieAddressAction
 * @param {Address} address - Wallet address of the account
 * @returns {Promise<void>} - void
 */
export const setAccountCookieAddressAction = async (address: Address): Promise<void> => {
  if (getAddressSafe(address)) {
    const accountCookie = await getAccountCookie();
    if (accountCookie.address !== address) {
      const cookieStore = await cookies();
      cookieStore.set(makeAccountCookie({
        ...accountCookie,
        address,
      }));
    }

  }
};

export const setAccountCookieSessionTicketAction = async (sessionTicket: string): Promise<void> => {
  const accountCooke = await getAccountCookie();
  if (sessionTicket !== accountCooke.sessionTicket) {
    const cookieStore = await cookies();
    cookieStore.set(makeAccountCookie({
      ...accountCooke,
      sessionTicket,
    }));
  }
};
