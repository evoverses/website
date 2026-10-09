import "server-only";
import { species as knownSpecies } from "@workspace/database/types/evo";
import { createNftSources } from "./sources";
import { localPlayerLogin, playerWebAuth } from "../server";
import { walletRpc } from "../wallet/server";
import { inventoryHandler } from "./handler";
import type { InventoryRow } from "./types";
export function inventoryImage(row: InventoryRow): string | null {
  if (row.kind === "item") return row.image;
  if (
    !row.species ||
    !(knownSpecies as readonly string[]).includes(row.species)
  )
    return null;
  const base = process.env.NEXT_PUBLIC_BASE_API_IMAGE_URL,
    suffix = process.env.NEXT_PUBLIC_API_IMAGE_SUFFIX;
  if (!base || !suffix) return null;
  let url: URL;
  try {
    url = new URL(base);
    if (!["https:", "http:"].includes(url.protocol)) return null;
  } catch {
    return null;
  }
  const variant =
    row.form === "egg"
      ? row.generation === 0 && row.tokenId
        ? String(BigInt(row.tokenId) % 4n)
        : "egg"
      : row.chroma && row.chroma !== "none"
        ? row.chroma
        : null;
  return `${base.replace(/\/$/, "")}/evo/${row.species}${variant ? `/${variant}` : ""}/${suffix}`;
}
export function playerInventory(request: Request) {
  return inventoryHandler(request, {
    enabled: localPlayerLogin,
    readInventory: (token) => playerWebAuth().readInventory(token),
    readCombat: (token,members) => playerWebAuth().readCombat(token,members),
    projection: (token) => walletRpc("projection", token, {}),
    sources: createNftSources(),
    image: inventoryImage,
  });
}
