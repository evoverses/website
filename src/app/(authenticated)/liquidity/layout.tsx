import { AccountProvider } from "@/components/providers/account-provider";
import { getAccountCookie } from "@/lib/cookies/account.server";
import { config } from "@/wagmi.config";
import { headers } from "next/headers";
import type { PropsWithChildren } from "react";
import { cookieToInitialState } from "wagmi";

const Layout = ({ children }: Readonly<PropsWithChildren>) => {
  const initialState = cookieToInitialState(config, headers().get("cookie"));
  const accountCookie = getAccountCookie();
  return (
    <AccountProvider initialState={initialState} accountCookie={accountCookie}>
      {children}
    </AccountProvider>
  );
};

export default Layout;
