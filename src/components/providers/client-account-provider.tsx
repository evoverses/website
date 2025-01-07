"use client";

import AccountCookieManager from "@/components/providers/account-cookie-manager";
import type { IAccountCookie } from "@/types/cookies";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren } from "react";
import { ThirdwebProvider } from "thirdweb/react";

const client = new QueryClient();
const ClientAccountProvider = (
  { accountCookie, children }: PropsWithChildren<{ accountCookie: IAccountCookie }>,
) => {
  return (
    <QueryClientProvider client={client}>
      <ThirdwebProvider>
        <AccountCookieManager accountCookie={accountCookie} />
        {children}
      </ThirdwebProvider>
    </QueryClientProvider>
  );
};
ClientAccountProvider.displayName = "ClientAccountProvider";

export { ClientAccountProvider };
