import { Address } from "abitype";

export type PropsWithAddress<T = {}> = T & { address?: Address }

export interface IAccountCookie {
  address: Address,
  loggedIn: boolean,
  sessionTicket: string,
}
