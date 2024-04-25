import { Address } from "abitype";

export type PropsWithAddress<T = {}> = T & { address?: Address }

export type IComputedAccountCookie = {
  /* Logged in to playfab */
  loggedIn: boolean;
  /* wallet connected */
  connected: boolean;
}

export type IStoredAccountCookie = {
  /* Wallet Address */
  address: Address;
  /* playfab session ticket */
  sessionTicket: string;
}

export type IAccountCookie = IComputedAccountCookie & IStoredAccountCookie;
