import { DeadBeef } from "@/data/constants";
import { getAddressSafe } from "@/lib/viem";
import { IAccountCookie, type IStoredAccountCookie } from "@/types/cookies";
import { type RequestCookies, ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

/** Get the current trade state from cookie storage
 *
 * @function getAccountCookie
 * @returns {IAccountCookie} - TradeCookie
 */
export const getMiddlewareAccountCookie = (cookies: RequestCookies): IAccountCookie => {
  const accountCookie = cookies.get("ev-account");
  // noinspection DuplicatedCode
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

export const makeAccountCookie = (accountCookie: IStoredAccountCookie): ResponseCookie => {
  const safeCookie = { address: DeadBeef, sessionTicket: "" };
  if (getAddressSafe(accountCookie.address)) {
    safeCookie.address = accountCookie.address;
  }
  if (accountCookie.sessionTicket) {
    safeCookie.sessionTicket = accountCookie.sessionTicket;
  }
  return {
    name: "ev-account",
    value: btoa(JSON.stringify(safeCookie)),
    httpOnly: true,
    path: "/",
    maxAge: 86_400,
  };
};
