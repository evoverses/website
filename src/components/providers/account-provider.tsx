import { ClientAccountProvider } from "@/components/providers/client-account-provider";
import { getAccountCookie } from "@/lib/cookies/account.server";
import { config } from "@/wagmi.config";
import { headers } from "next/headers";
import { PropsWithChildren } from "react";
import { cookieToInitialState } from "wagmi";

const AccountProvider = ({ children }: PropsWithChildren) => {
  const initialState = cookieToInitialState(config, headers().get("cookie"));
  const accountCookie = getAccountCookie();
  return (
    <ClientAccountProvider initialState={initialState} accountCookie={accountCookie}>
      {children}
    </ClientAccountProvider>
  );
};
AccountProvider.displayName = "AccountProvider";
export { AccountProvider };
