"use client";
import AccountCookieManager from "@/components/providers/account-cookie-manager";
import ThemeProvider from "@/components/providers/theme-provider";
import Web3Provider from "@/components/providers/web3-provider";
import { PropsWithChildren } from "react";

export const GlobalProvider = ({ children }: PropsWithChildren) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  );
};

export const AccountProvider = ({ children }: PropsWithChildren) => {
  return (
    <Web3Provider>
      <AccountCookieManager />
      {children}
    </Web3Provider>
  );
};
