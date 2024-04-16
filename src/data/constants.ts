import { IAccountCookie } from "@/types/cookies";
import { Address } from "abitype";

export const DeadBeef: Address = "0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF";

export const DefaultAccountCookie: IAccountCookie = {
  address: DeadBeef,
  loggedIn: false,
  sessionTicket: "",
};

export const DEV_MODE = process.env.NODE_ENV === "development";

export const BASE_URL = `http${process.env.NODE_ENV === "development" ? "://localhost:3000" : "s://evoverses.com"}`;
