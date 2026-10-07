import type { Inventory } from "../auth-core";
import displayCatalogue from "@/data/inventory-items.json";
import type { InventoryRow } from "./types";
const display = displayCatalogue as Record<
  string,
  { name: string; category: string; image: string | null }
>;
export const title = (value: string) =>
  value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
export function ordinaryInventory(inventory: Inventory): InventoryRow[] {
  return [
    ...inventory.items
      .filter((item) => item.quantity > 0)
      .map((item) => ({
        id: `item:${item.productId}:${item.revision}`,
        kind: "item" as const,
        name: display[item.productId]?.name || title(item.productId),
        image: display[item.productId]?.image || null,
        quantity: item.quantity,
        xp: null,
        species: null,
        category: display[item.productId]?.category || "supplies",
        revision: item.revision,
      })),
    ...inventory.evos.map((evo) => ({
      id: `evo:${evo.id}`,
      kind: "evo" as const,
      name: title(evo.speciesKey),
      image: null,
      quantity: 1,
      xp: evo.experience,
      species: evo.speciesKey,
      category: "Evos",
    })),
  ];
}
export type InventoryFilters = {
  search: string;
  type: string;
  wallet: string;
  sort: string;
  proMode: boolean;
};
export function visibleInventory(
  rows: InventoryRow[],
  filters: InventoryFilters,
) {
  const type =
    !filters.proMode && ["nft", "egg"].includes(filters.type)
      ? "all"
      : filters.type;
  const wallet = filters.proMode ? filters.wallet : "all",
    query = filters.search.trim().toLowerCase();
  const result = rows.filter((row) => {
    if (row.kind === "nft" && !filters.proMode) return false;
    if (type === "item" && row.kind !== "item") return false;
    if (
      type === "evo" &&
      !(row.kind === "evo" || (row.kind === "nft" && row.form === "evo"))
    )
      return false;
    if (type === "nft" && row.kind !== "nft") return false;
    if (type === "egg" && !(row.kind === "nft" && row.form === "egg"))
      return false;
    if (wallet === "account" && row.kind === "nft") return false;
    if (wallet !== "all" && wallet !== "account" && row.walletId !== wallet)
      return false;
    const searchable = [
      row.name,
      row.species,
      row.category,
      row.tokenId,
      row.walletLabel,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return !query || searchable.includes(query);
  });
  const name = (a: InventoryRow, b: InventoryRow) =>
    a.name.localeCompare(b.name, "en", {
      numeric: true,
      sensitivity: "base",
    }) || a.id.localeCompare(b.id, "en", { numeric: true });
  return result.sort((a, b) => {
    if (filters.sort === "name-desc") return -name(a, b);
    if (filters.sort === "xp-desc")
      return (b.xp ?? -1) - (a.xp ?? -1) || name(a, b);
    if (filters.sort === "quantity-desc")
      return b.quantity - a.quantity || name(a, b);
    return name(a, b);
  });
}
