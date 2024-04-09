"use client";
import { config } from "@/wagmi.config";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { type State, WagmiProvider } from "wagmi";

const queryClient = new QueryClient();

const Web3Provider = ({ initialState, children }: PropsWithChildren<{ initialState?: State }>) => {
  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default Web3Provider;
