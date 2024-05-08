"use client";
import QueryProvider from "@/components/providers/query-provider";
import { config } from "@/wagmi.config";
import type { PropsWithChildren } from "react";
import { type State, WagmiProvider } from "wagmi";

const Web3Provider = ({ initialState, children }: PropsWithChildren<{ initialState?: State }>) => {
  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryProvider>
        {children}
      </QueryProvider>
    </WagmiProvider>
  );
};

export default Web3Provider;
