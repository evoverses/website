import type { SquidAsset } from "@/lib/squid/types";

export const toAssetUrl = (asset: SquidAsset) => `/assets/${asset.metadata.type.toLowerCase()}/${asset.tokenId}`;
export const toCollectionUrl = (asset: SquidAsset) => `/assets/${asset.metadata.type.toLowerCase()}`;
export const toAccountUrl = (account?: string) => account ? `/accounts/${account}` : "#";
export const toBlockExplorerTxUrl = (
  txHash: string | undefined,
  { chainId }: { chainId: number | string },
) => txHash ? `https://snowscan.xyz/tx/${txHash}` : "#";
