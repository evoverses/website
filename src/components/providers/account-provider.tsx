"use client";
import AccountCookieManager from "@/components/providers/account-cookie-manager";
import Web3Provider from "@/components/providers/web3-provider";
import type { IAccountCookie } from "@/types/cookies";
import { config, projectId } from "@/wagmi.config";
import type { Token } from "@web3modal/core";
import { createWeb3Modal } from "@web3modal/wagmi/react";
import { PropsWithChildren } from "react";
import { avalanche } from "viem/chains";
import type { State } from "wagmi";

createWeb3Modal({
  wagmiConfig: config,
  projectId,
  defaultChain: avalanche,
  enableOnramp: true,
  enableAnalytics: true,
  tokens: {
    43114: {
      address: "0x42006Ab57701251B580bDFc24778C43c9ff589A1",
      image: "https://evoverses.com/EVO.png",
    },
  } as Record<number, Token>,
  featuredWalletIds: [
    "f323633c1f67055a45aac84e321af6ffe46322da677ffdd32f9bc1e33bafe29c", // Core
    "a9751f17a3292f2d1493927f0555603d69e9a3fcbcdf5626f01b49afa21ced91", // Frame
    "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96", // Metamask
    "225affb176778569276e484e1b92637ad061b01e13a048b35a9d280c3b58970f", // Safe
  ],
  termsConditionsUrl: "https://evoverses.com/terms",
  privacyPolicyUrl: "https://evoverses.com/privacy",
  themeVariables: {
    "--w3m-accent": "hsl(142.1 70.6% 45.3%)",
  },
});

type AccountProviderProps = {
  accountCookie?: IAccountCookie;
  initialState?: State
}

export const AccountProvider = ({ initialState, accountCookie, children }: PropsWithChildren<AccountProviderProps>) => {
  return (
    <Web3Provider initialState={initialState}>
      <AccountCookieManager accountCookie={accountCookie} />
      {children}
    </Web3Provider>
  );
};
