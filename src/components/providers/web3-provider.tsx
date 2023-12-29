"use client";
import { createWeb3Modal, defaultWagmiConfig } from "@web3modal/wagmi/react";
import { useTheme } from "next-themes";
import { PropsWithChildren } from "react";
import { Address, WagmiConfig } from "wagmi";
import { avalanche } from "wagmi/chains";

const avvyDomainsResolver: Address = "0x40b0DC99681Db9703939bd62D76F4D448ab0fdE";

const chains = [
  {
    ...avalanche,
    contracts: {
      ...avalanche.contracts,
      ensUniversalResolver: {
        address: avvyDomainsResolver,
      },
    },
  },
];

const metadata = {
  name: "EvoVerses",
  description: "A 3D monster battling game bringing Web2 and Web3 together in one platform.",
  url: "https://evoverses.com",
  icons: [ "https://evoverses.com/icon.png" ],
};
const projectId = process.env.WALLETCONNECT_PROJECT_ID || process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

const wagmiConfig = defaultWagmiConfig({ chains, projectId, metadata });

createWeb3Modal({
  wagmiConfig,
  projectId,
  chains,
  defaultChain: avalanche,
  tokens: {
    43114: {
      address: "0x42006Ab57701251B580bDFc24778C43c9ff589A1",
      image: "https://evoverses.com/EVO.png",
    },
  },
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



const Web3Provider = ({ children }: PropsWithChildren) => {
  const { resolvedTheme } = useTheme();
  return (
    <>
      <WagmiConfig config={wagmiConfig}>
        {children}
      </WagmiConfig>
    </>
  );
};

export default Web3Provider;
