import { combatDetails } from "./combat";
import { isGeneratedStats, evoProgression } from "./evo";
import type { Inventory } from "../auth-core";
import displayCatalogue from "@/data/inventory-items.json";
import type { InventoryRow } from "./types";
const display = displayCatalogue as Record<
  string,
  { name: string; category: string; image: string | null }
>;
export const title = (value: string) =>
  value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
function ordinaryEvo(evo: Inventory["evos"][number]): InventoryRow {
  const experience = evo.combat?.experience ?? evo.experience;
  const row: InventoryRow = {
    id: `evo:${evo.id}`, kind: "evo", name: title(evo.speciesKey),
    image: null, quantity: 1, xp: experience, species: evo.speciesKey,
    category: "Evos", displayId: evo.displayId,
  };
  if (isGeneratedStats(evo.stats)) {
    try {
      const details = evoProgression(evo.speciesKey, evo.stats, experience);
      if (evo.combat?.level !== undefined && details.level !== evo.combat.level) throw Error("Invalid Evo progression");
      row.details = evo.combat ? combatDetails(details, evo.combat, evo.speciesKey) : details;
    } catch {
      // Keep the holding and the rest of the profile available. Never turn
      // inconsistent battle data into apparently verified HP or learned moves.
      row.detailsUnavailable = true;
    }
  }
  return row;
}
export function ordinaryInventory(inventory: Inventory): InventoryRow[] {
  // Revisions identify storage stacks; Profile shows one total per product.
  const items = new Map<string, InventoryRow>();
  for (const item of inventory.items) {
    if (item.quantity <= 0) continue;
    const existing = items.get(item.productId);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      items.set(item.productId, {
        id: `item:${item.productId}`,
        kind: "item",
        name: display[item.productId]?.name || title(item.productId),
        image: display[item.productId]?.image || null,
        quantity: item.quantity,
        xp: null,
        species: null,
        category: display[item.productId]?.category || "supplies",
      });
    }
  }
  return [
    ...items.values(),
    ...inventory.evos.map(ordinaryEvo),
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
      row.displayId,
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
