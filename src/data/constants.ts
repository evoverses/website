import { IAccountCookie } from "@/types/cookies";
import { Address } from "abitype";

export const DeadBeef: Address = "0xD34D00000000000000000000000000000000B33F";

export const DefaultAccountCookie: IAccountCookie = {
  address: DeadBeef,
  loggedIn: false,
  sessionTicket: "",
};
