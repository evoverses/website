import { defaultWagmiConfig } from "@web3modal/wagmi/react/config";
import { Address } from "abitype";
import { cookieStorage, type CreateConfigParameters, createStorage } from "wagmi";
import { avalanche as avalancheBase, type Chain } from "wagmi/chains";

const avvyDomainsResolver: Address = "0x40b0DC99681Db9703939bd62D76F4D448ab0fdE";

const avalanche: Chain = {
  ...avalancheBase,
  contracts: {
    ...avalancheBase.contracts,
    ensUniversalResolver: {
      address: avvyDomainsResolver,
    },
  },
} as const;

const chains = [ avalanche ] as CreateConfigParameters["chains"];

const metadata = {
  name: "EvoVerses",
  description: "A 3D monster battling game bringing Web2 and Web3 together in one platform.",
  url: "https://evoverses.com",
  icons: [ "https://evoverses.com/icon.png" ],
};
export const projectId = process.env.WALLETCONNECT_PROJECT_ID || process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata: metadata,
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
  enableEmail: true,
} as any /* Needed until types are fixed upstream */);
