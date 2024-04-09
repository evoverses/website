import AccountCookieManager from "@/components/providers/account-cookie-manager";
import Web3Provider from "@/components/providers/web3-provider";
import { config } from "@/wagmi.config";
import { headers } from "next/headers";
import { PropsWithChildren } from "react";
import { cookieToInitialState } from "wagmi";

export const AccountProvider = ({ children }: PropsWithChildren) => {
  const initialState = cookieToInitialState(config, headers().get("cookie"));
  return (
    <Web3Provider initialState={initialState}>
      <AccountCookieManager />
      {children}
    </Web3Provider>
  );
};
