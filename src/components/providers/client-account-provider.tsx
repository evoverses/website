"use client";

import AccountCookieManager from "@/components/providers/account-cookie-manager";
import { ThirdwebProvider } from "@/components/providers/web3-provider";
import type { IAccountCookie } from "@/types/cookies";
import { PropsWithChildren } from "react";

const ClientAccountProvider = (
  { accountCookie, children }: PropsWithChildren<{ accountCookie: IAccountCookie }>,
) => {
  return (
    <ThirdwebProvider>
      <AccountCookieManager accountCookie={accountCookie} />
      {children}
    </ThirdwebProvider>
  );
};
ClientAccountProvider.displayName = "ClientAccountProvider";

export { ClientAccountProvider };
