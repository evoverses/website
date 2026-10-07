"use client";
import { useState } from "react";
import Image from "next/image";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useProMode } from "@/components/providers/pro-mode-provider";
import {
  ordinaryInventory,
  title,
  visibleInventory,
} from "@/lib/player/inventory/model";
import type {
  AccountInventory,
  InventoryRow,
} from "@/lib/player/inventory/types";
import type { Inventory } from "@/lib/player/auth-core";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Egg, Package, Sparkles } from "lucide-react";

const warnings: Record<string, string> = {
  DATA_SERVICE_UNAVAILABLE:
    "Creature details are temporarily unavailable. Your wallet holdings have not changed.",
  OWNERSHIP_UNAVAILABLE:
    "Some wallet holdings could not be checked. Unverified Evos are omitted; retry shortly.",
  METADATA_PENDING:
    "Some wallet Evos are awaiting details from the data service.",
  METADATA_INCOMPLETE:
    "Some creature details are incomplete and could not be displayed.",
  INDEXER_REFRESHING:
    "Some Evos have moved wallets. The data service is catching up.",
};
async function fetchInventory(
  includeNfts: boolean,
  page: number,
  linksVersion: string | null,
  signal: AbortSignal,
): Promise<AccountInventory> {
  const response = await fetch("/api/player/inventory", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    cache: "no-store",
    signal,
    body: JSON.stringify({ includeNfts, page, linksVersion }),
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(
      response.status === 401
        ? "Sign in again to load your inventory."
        : response.status === 409
          ? "Your wallet links changed. Refresh your inventory."
          : "We couldn’t load your inventory. Try again shortly.",
    );
  return result;
}
function InventoryArt({ row }: { row: InventoryRow }) {
  const [failed, setFailed] = useState(false);
  const Icon =
    row.kind === "item" ? Package : row.form === "egg" ? Egg : Sparkles;
  return (
    <div className="flex aspect-square items-center justify-center rounded-xl bg-primary/5 p-3">
      {row.image && !failed ? (
        <Image
          width={256}
          height={256}
          unoptimized
          src={row.image}
          alt={row.name}
          className="h-full w-full object-contain"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <Icon className="h-14 w-14 text-primary/60" aria-hidden="true" />
      )}
    </div>
  );
}
function InventoryCard({ row }: { row: InventoryRow }) {
  return (
    <li
      className="min-w-0 space-y-2 rounded-xl border bg-muted/20 p-3"
      data-testid="inventory-card"
      data-kind={row.kind}
    >
      <InventoryArt key={row.image || row.id} row={row} />
      <h4 className="font-bold capitalize">{row.name}</h4>
      {row.kind === "item" ? (
        <p className="text-sm">
          Quantity: {row.quantity.toLocaleString("en-US")}
        </p>
      ) : (
        <p className="text-sm">
          {row.xp === null
            ? row.form === "egg"
              ? "Waiting to hatch"
              : "XP unavailable"
            : `${row.xp.toLocaleString("en-US")} Evo XP`}
        </p>
      )}
      {row.kind === "item" && (
        <p className="text-xs capitalize text-muted-foreground">
          {title(row.category)}
        </p>
      )}
      {row.kind === "nft" && (
        <>
          <p className="text-xs text-muted-foreground">
            {row.form === "egg" ? `Egg #${row.tokenId}` : "NFT Evo"}
            {row.generation === null ? "" : ` · Generation ${row.generation}`}
          </p>
          <p
            className="break-words text-xs font-semibold"
            data-testid="inventory-wallet"
          >
            Wallet {row.walletLabel}
          </p>
        </>
      )}
    </li>
  );
}
const selectStyle =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
export function AccountInventoryView({
  playerId,
  initialInventory,
}: {
  playerId: string;
  initialInventory: Inventory | null;
}) {
  const { proMode, ready } = useProMode();
  const [search, setSearch] = useState(""),
    [type, setType] = useState("all"),
    [sort, setSort] = useState("name-asc"),
    [wallet, setWallet] = useState("all");
  const query = useInfiniteQuery({
    queryKey: ["player-inventory", playerId, proMode],
    meta: { private: true },
    gcTime: 0,
    enabled: ready,
    initialPageParam: { page: 0, version: null as string | null },
    queryFn: ({ pageParam, signal }) =>
      fetchInventory(proMode, pageParam.page, pageParam.version, signal),
    getNextPageParam: (last) =>
      last.nfts?.nextPage === null || last.nfts?.nextPage === undefined
        ? undefined
        : { page: last.nfts.nextPage, version: last.nfts.linksVersion },
    staleTime: 0,
    refetchInterval: 60_000,
    retry: false,
  });
  const pages = query.data?.pages || [],
    first = pages[0];
  const ordinary = query.isError
    ? []
    : first?.rows ||
      (initialInventory ? ordinaryInventory(initialInventory) : []);
  const nftMap = new Map<string, InventoryRow>();
  if (proMode && !query.isError)
    pages.forEach((page) =>
      page.nfts?.rows.forEach((row) => nftMap.set(row.id, row)),
    );
  const nftRows = [...nftMap.values()],
    wallets = proMode ? first?.nfts?.wallets || [] : [];
  const effectiveType =
    !proMode && ["nft", "egg"].includes(type) ? "all" : type;
  const effectiveWallet =
    proMode && (wallet === "account" || wallets.some((w) => w.id === wallet))
      ? wallet
      : "all";
  const shown = visibleInventory([...ordinary, ...nftRows], {
    search,
    type: effectiveType,
    sort,
    wallet: effectiveWallet,
    proMode,
  });
  const itemRows = shown.filter((r) => r.kind === "item"),
    evoRows = shown.filter((r) => r.kind === "evo"),
    nfts = shown.filter((r) => r.kind === "nft");
  const messages = proMode
    ? [...new Set(pages.flatMap((page) => page.nfts?.warnings || []))]
    : [];
  const loading = ready && query.isPending;
  const resetFilters = () => {
    setSearch("");
    setType("all");
    setWallet("all");
    setSort("name-asc");
  };
  const section = (name: string, rows: InventoryRow[], empty: string) => (
    <div className="space-y-3">
      <h3 className="font-bold">
        {name}{" "}
        <span className="font-normal text-muted-foreground">
          ({rows.length})
        </span>
      </h3>
      {rows.length ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {rows.map((row) => (
            <InventoryCard key={row.id} row={row} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{empty}</p>
      )}
    </div>
  );
  return (
    <section
      className="space-y-5 rounded-2xl border bg-card p-5"
      data-testid="account-inventory"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Your inventory</h2>
          <p className="text-sm text-muted-foreground">
            Your Evos and items, together in one place.
          </p>
        </div>
        <Button
          variant="outline"
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          {query.isFetching ? "Refreshing…" : "Refresh inventory"}
        </Button>
      </div>
      <div
        className={`grid gap-3 ${proMode ? "sm:grid-cols-2 xl:grid-cols-4" : "sm:grid-cols-3"}`}
      >
        <label className="space-y-1 text-sm font-semibold">
          Search
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Find an Evo or item"
            type="search"
          />
        </label>
        <label className="space-y-1 text-sm font-semibold">
          Show
          <select
            className={selectStyle}
            value={effectiveType}
            onChange={(event) => setType(event.target.value)}
          >
            <option value="all">All inventory</option>
            <option value="item">Items</option>
            <option value="evo">Evos</option>
            {proMode && (
              <>
                <option value="nft">NFT Evos & eggs</option>
                <option value="egg">Eggs</option>
              </>
            )}
          </select>
        </label>
        <label className="space-y-1 text-sm font-semibold">
          Sort by
          <select
            className={selectStyle}
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="name-asc">Name: A–Z</option>
            <option value="name-desc">Name: Z–A</option>
            <option value="xp-desc">Highest XP</option>
            <option value="quantity-desc">Highest quantity</option>
          </select>
        </label>
        {proMode && (
          <label className="space-y-1 text-sm font-semibold">
            Wallet
            <select
              className={selectStyle}
              value={effectiveWallet}
              onChange={(event) => setWallet(event.target.value)}
            >
              <option value="all">All inventory</option>
              <option value="account">Game account</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p data-testid="inventory-summary">
          {ordinary.filter((r) => r.kind === "item").length} item types ·{" "}
          {ordinary.filter((r) => r.kind === "evo").length} Evos
          {proMode ? ` · ${nftRows.length} NFT Evos & eggs loaded` : ""}
        </p>
        <Button variant="ghost" size="sm" onClick={resetFilters}>
          Clear filters
        </Button>
      </div>
      {loading && <p role="status">Loading inventory…</p>}
      {query.isError ? (
        <p role="alert">{query.error.message}</p>
      ) : (
        <>
          {["all", "item"].includes(effectiveType) &&
            ["all", "account"].includes(effectiveWallet) &&
            section(
              "Items",
              itemRows,
              loading
                ? "Loading items…"
                : ordinary.some((r) => r.kind === "item")
                  ? "No items match these filters."
                  : "You don’t have any items yet.",
            )}
          {["all", "evo"].includes(effectiveType) &&
            ["all", "account"].includes(effectiveWallet) &&
            section(
              "Evos",
              evoRows,
              loading
                ? "Loading Evos…"
                : ordinary.some((r) => r.kind === "evo")
                  ? "No Evos match these filters."
                  : "You don’t have any Evos in this account yet.",
            )}
          {proMode &&
            ["all", "evo", "nft", "egg"].includes(effectiveType) &&
            effectiveWallet !== "account" && (
              <div
                className="space-y-3 border-t pt-5"
                data-testid="inventory-nft-panel"
              >
                {section(
                  "NFT Evos & eggs",
                  nfts,
                  loading
                    ? "Loading linked-wallet Evos…"
                    : messages.length
                      ? "Some holdings are unavailable; see the notices below."
                      : wallets.length
                        ? query.hasNextPage
                          ? "No matching NFT Evos loaded yet. Load more to check the remaining holdings."
                          : nftRows.length
                            ? "No NFT Evos match these filters."
                            : "No NFT Evos or eggs were found in your linked wallets."
                        : "Link a wallet to your trainer to include its Evos here.",
                )}
                {messages.map((code) => (
                  <p
                    key={code}
                    role="status"
                    className="text-sm text-muted-foreground"
                  >
                    {warnings[code] || "Some holdings could not be loaded."}
                  </p>
                ))}
                {query.hasNextPage && (
                  <>
                    <p className="text-xs text-muted-foreground">
                      Filters and sorting apply to the loaded inventory. Load
                      more to include the remaining wallet Evos.
                    </p>
                    <Button
                      variant="outline"
                      disabled={query.isFetchingNextPage}
                      onClick={() => void query.fetchNextPage()}
                    >
                      {query.isFetchingNextPage
                        ? "Loading more…"
                        : "Load more NFT Evos"}
                    </Button>
                  </>
                )}
              </div>
            )}
        </>
      )}
    </section>
  );
}
