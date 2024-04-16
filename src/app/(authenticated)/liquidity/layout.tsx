import { AccountProvider } from "@/components/providers/account-provider";
import { config } from "@/wagmi.config";
import { headers } from "next/headers";
import type { PropsWithChildren } from "react";
import { cookieToInitialState } from "wagmi";

const Layout = ({ children }: Readonly<PropsWithChildren>) => {
  const initialState = cookieToInitialState(config, headers().get("cookie"));
  return (
    <AccountProvider initialState={initialState}>
      {children}
    </AccountProvider>
  );
};

export default Layout;
