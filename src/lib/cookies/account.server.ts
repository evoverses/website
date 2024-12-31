import "server-only";
import { DeadBeef } from "@/data/constants";
import { getAddressSafe } from "@/lib/viem";
import { IAccountCookie } from "@/types/cookies";
import { cookies } from "next/headers";

/** Get the current trade state from cookie storage
 *
 * @function getAccountCookie
 * @returns {IAccountCookie} - TradeCookie
 */
export const getAccountCookie = async (): Promise<IAccountCookie> => {
  const cookiesList = await cookies();
  // noinspection DuplicatedCode
  const accountCookie = cookiesList.get("ev-account");
  if (accountCookie) {
    const cookie = JSON.parse(atob(accountCookie.value));
    if (process.env.IMPERSONATE === "true" && getAddressSafe(process.env.IMPERSONATE_ADDRESS)) {
      cookie.address = process.env.IMPERSONATE_ADDRESS;
    }
    const merged = { address: DeadBeef, sessionTicket: "", ...cookie };
    if (!getAddressSafe(merged.address)) {
      merged.address = DeadBeef;
    }
    return { ...merged, loggedIn: merged.sessionTicket?.length > 0, connected: merged.address !== DeadBeef };
  }

  return { address: DeadBeef, sessionTicket: "", loggedIn: false, connected: false };
};
