import { DefaultAccountCookie } from "@/data/constants";
import { IAccountCookie } from "@/types/cookies";
import { type RequestCookies, ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

/** Get the current trade state from cookie storage
 *
 * @function getAccountCookie
 * @returns {IAccountCookie} - TradeCookie
 */
export const getMiddlewareAccountCookie = (cookies: RequestCookies): IAccountCookie => {
  const accountCookie = cookies.get("ev-account");
  if (accountCookie) {
    const cookie = JSON.parse(atob(accountCookie.value));
    return { ...DefaultAccountCookie, ...cookie };
  }
  return DefaultAccountCookie;
};

export const makeAccountCookie = (accountCookie: IAccountCookie): ResponseCookie => {
  return {
    name: "ev-account",
    value: btoa(JSON.stringify(accountCookie)),
    httpOnly: true,
    path: "/",
    maxAge: 86_400,
  };
};
