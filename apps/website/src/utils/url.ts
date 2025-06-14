import type { SquidAsset } from "@/lib/squid/types";

export const toAssetUrl = (asset: SquidAsset) => `/assets/${asset.metadata.type.toLowerCase()}/${asset.tokenId}`;
export const toCollectionUrl = (asset: SquidAsset) => `/assets/${asset.metadata.type.toLowerCase()}`;
export const toAccountUrl = (account?: string) => account ? `/accounts/${account}` : "#";
export const toBlockExplorerTxUrl = (
  txHash: string | undefined,
  { chainId }: { chainId: number | string },
) => txHash ? `https://snowscan.xyz/tx/${txHash}` : "#";

export const getUrlAndParams = () => {
  if (typeof window === "undefined") {
    throw new Error("window is undefined");
  }
  const url = new URL(window.location.href);
  const params = new URLSearchParams(url.search);
  return { url, params };
};

export const setClientSideUrl = (url: URL, params: URLSearchParams) => {
  const search = params.toString();
  window.history.replaceState({}, "", `${url.pathname}${search ? `?${params}` : ""}`);
};
