import { generatePayload, isLoggedIn, login, logout } from "@/lib/thirdweb/auth";
import { SiweAuthOptions } from "thirdweb/react";

export const auth: SiweAuthOptions = {
  isLoggedIn,
  doLogin: login,
  getLoginPayload: generatePayload,
  doLogout: logout,
};
