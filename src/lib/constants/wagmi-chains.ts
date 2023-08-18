import { Chain } from "wagmi";

export const bobaAvax = {
  id: 43_288,
  name: 'Boba Avax',
  network: 'bobaavax',
  nativeCurrency: {
    decimals: 18,
    name: 'Boba',
    symbol: 'BOBA',
  },
  rpcUrls: {
    public: { http: [ 'https://avax.boba.network' ] },
    default: { http: [ 'https://replica.avax.boba.network' ] },
  },
  blockExplorers: {
    blockscout: { name: 'Block Explorer', url: 'https://blockexplorer.avax.boba.network/' },
    default: { name: 'Block Explorer', url: 'https://blockexplorer.avax.boba.network/' },
  },
  contracts: {
    multicall3: {
      address: '0x352E11Da7C12EA2440b079A335E67ff9219f6FfB',
      blockCreated: 4_832,
    },
  },
} as const satisfies Chain
