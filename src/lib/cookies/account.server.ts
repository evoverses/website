import "server-only";
import { DefaultAccountCookie } from "@/data/constants";
import { getAddressSafe } from "@/lib/viem";
import { IAccountCookie } from "@/types/cookies";
import { cookies } from "next/headers";

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
