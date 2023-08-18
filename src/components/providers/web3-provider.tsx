"use client";
import { bobaAvax } from "@/lib/constants/wagmi-chains";
import { EthereumClient, w3mConnectors, w3mProvider } from "@web3modal/ethereum";
import { Web3Modal } from "@web3modal/react";
import { PropsWithChildren } from "react";
import { publicProvider } from 'wagmi/providers/public'
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'
import { Chain, configureChains, createConfig, WagmiConfig } from "wagmi";
import { avalanche } from "wagmi/chains";
import { useTheme } from "next-themes";

const chains = [ avalanche, bobaAvax ];
const projectId = process.env.WALLETCONNECT_PROJECT_ID || process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

const { publicClient } = configureChains(chains, [
  w3mProvider({ projectId }),
  jsonRpcProvider({ rpc: (chain: Chain) => ({ http: chain.rpcUrls.default.http[0] }) }),
  publicProvider(),
]);
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: w3mConnectors({ projectId, chains }),
  publicClient,
});

const ethereumClient = new EthereumClient(wagmiConfig, chains);

const chainImages = {
  43_288: "https://bobascan.com/images/svg/brands/main.svg"
}
const tokenImages = {
  EVO: "/EVO.png",
};

const tokenContracts = {
  43_288: "0x3e9694a37846C864C67253af6F5d1F534ff3BF46",
  43_114: "0x42006Ab57701251B580bDFc24778C43c9ff589A1"
}
const Web3Provider = ({ children }: PropsWithChildren) => {
  const { resolvedTheme } = useTheme();
  return (
    <>
      <WagmiConfig config={wagmiConfig}>
        {children}
      </WagmiConfig>
      <Web3Modal
        projectId={projectId}
        ethereumClient={ethereumClient}
        chainImages={chainImages}
        tokenImages={tokenImages}
        tokenContracts={tokenContracts}
        themeMode={(resolvedTheme as 'dark' | 'light' | undefined)  || 'dark'}
        themeVariables={{
          "--w3m-accent-color": "hsl(142.1 70.6% 45.3%)",
          "--w3m-background-color": "hsl(142.1 70.6% 45.3%)"
        }}
      />
    </>
  );
};

export default Web3Provider;
