"use client";
import ThemeProvider from "@/components/providers/theme-provider";
import Web3Provider from "@/components/providers/web3-provider";
import { PropsWithChildren } from "react";

const Providers = ({ children }: PropsWithChildren) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Web3Provider>
        {children}
      </Web3Provider>
    </ThemeProvider>
  );
};

export default Providers;
