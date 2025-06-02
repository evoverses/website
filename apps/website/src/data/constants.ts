import { type IStoredAccountCookie } from "@/types/cookies";
import { Address } from "thirdweb";

export const DeadBeef: Address = "0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF";

export const DefaultAccountCookie: IStoredAccountCookie = {
  address: DeadBeef,
  sessionTicket: "",
};

export const DEV_MODE = process.env.NODE_ENV === "development";

export const BASE_URL = `http${process.env.NODE_ENV === "development" ? "://localhost:3000" : "s://evoverses.com"}`;
