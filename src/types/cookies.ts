import { Address } from "abitype";

export interface IAccountCookie {
  address: Address,
  loggedIn: boolean,
  sessionTicket: string,
}
