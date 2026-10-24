import { resolveNurseryNetwork } from "./network-config";
export { chainlinkFujiWrapper } from "./network-config";
// Public settings are statically substituted by Next.js. No query or browser override.
const network = resolveNurseryNetwork({
  NEXT_PUBLIC_NURSERY_NETWORK: process.env.NEXT_PUBLIC_NURSERY_NETWORK,
  NEXT_PUBLIC_NURSERY_EVO_ADDRESS: process.env.NEXT_PUBLIC_NURSERY_EVO_ADDRESS,
  NEXT_PUBLIC_NURSERY_NFT_ADDRESS: process.env.NEXT_PUBLIC_NURSERY_NFT_ADDRESS,
  NEXT_PUBLIC_NURSERY_BERTHA_ADDRESS: process.env.NEXT_PUBLIC_NURSERY_BERTHA_ADDRESS,
  NEXT_PUBLIC_NURSERY_HERMANN_ADDRESS: process.env.NEXT_PUBLIC_NURSERY_HERMANN_ADDRESS,
  NEXT_PUBLIC_NURSERY_WRAPPER_ADDRESS: process.env.NEXT_PUBLIC_NURSERY_WRAPPER_ADDRESS,
  NEXT_PUBLIC_NURSERY_HERMANN_HISTORY: process.env.NEXT_PUBLIC_NURSERY_HERMANN_HISTORY,
  NEXT_PUBLIC_NURSERY_MAINNET_APPROVED: process.env.NEXT_PUBLIC_NURSERY_MAINNET_APPROVED,
  NEXT_PUBLIC_NURSERY_REGISTRY_VERSION: process.env.NEXT_PUBLIC_NURSERY_REGISTRY_VERSION,
  NEXT_PUBLIC_FUJI_EVO_ADDRESS: process.env.NEXT_PUBLIC_FUJI_EVO_ADDRESS,
  NEXT_PUBLIC_FUJI_EVO_NFT_ADDRESS: process.env.NEXT_PUBLIC_FUJI_EVO_NFT_ADDRESS,
  NEXT_PUBLIC_FUJI_BERTHA_ADDRESS: process.env.NEXT_PUBLIC_FUJI_BERTHA_ADDRESS,
  NEXT_PUBLIC_FUJI_HERMANN_ADDRESS: process.env.NEXT_PUBLIC_FUJI_HERMANN_ADDRESS,
  NEXT_PUBLIC_FUJI_WRAPPER_ADDRESS: process.env.NEXT_PUBLIC_FUJI_WRAPPER_ADDRESS,
  NEXT_PUBLIC_FUJI_HERMANN_HISTORY: process.env.NEXT_PUBLIC_FUJI_HERMANN_HISTORY,
});
export const nurseryChain = network.chain;
export const nurseryNetworkMessage = network.message;
export const nurseryTokenAddress = network.token;
export const nurseryNftAddress = network.nft;
export const nurseryBerthaAddress = network.bertha;
export const nurseryHermannAddress = network.hermann;
export const nurseryWrapperAddress = network.wrapper;
export const nurseryNetworkConfigured = network.configured;
export const nurseryTransactionsEnabled = network.transactionsEnabled;
export const usesChainlinkRandomness = network.chainlink;
export const nurseryRegistryVersion = process.env.NEXT_PUBLIC_NURSERY_REGISTRY_VERSION === "2" ? 2 : 1;
export const nurseryHermannHistory = network.history;
