"use client";

import { chain, chains } from "@/lib/thirdweb/config";
import { useCallback } from "react";
import { defineChain } from "thirdweb";
import { useActiveWalletChain, useSwitchActiveWalletChain } from "thirdweb/react";

export const useChain = () => {
  const walletChain = useActiveWalletChain();
  const switchChain = useSwitchActiveWalletChain();

  const switchChainIfNeeded = useCallback(async (chainId: number | string) => {
    if (walletChain && walletChain.id.toString() !== String(chainId)) {
      await switchChain(defineChain(Number(chainId)));
    }
  }, [ switchChain, walletChain ]);

  return {
    chain,
    chains,
    switchChainIfNeeded,
  };
};
