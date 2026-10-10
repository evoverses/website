export type InventoryRow = {
  id: string;
  kind: "item" | "evo" | "nft";
  name: string;
  image: string | null;
  quantity: number;
  xp: number | null;
  species: string | null;
  category: string;
  displayId?: string;
  details?: ReturnType<typeof import("./evo").evoProgression>;
  revision?: number;
  generation?: number | null;
  tokenId?: string;
  form?: "evo" | "egg";
  walletId?: string;
  walletLabel?: string;
  chroma?: string | null;
  rarity?: string | null;
};
export type InventoryWallet = { id: string; label: string };
export type NftInventoryPage = {
  rows: InventoryRow[];
  wallets: InventoryWallet[];
  nextPage: number | null;
  linksVersion: string;
  chainTotal: number | null;
  warnings: string[];
  checkedAt: string;
};
export type AccountInventory = {
  rows: InventoryRow[];
  nfts: NftInventoryPage | null;
};
export type PrivateWalletProjection = {
  wallets: { id: string; chainId: number; address: string; label: string }[];
  version: string;
};
