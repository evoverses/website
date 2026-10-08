"use client";
import { useEffect, useRef, useState } from "react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { statKeys } from "@/lib/player/inventory/evo";
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
    <div
      className={
        row.kind === "item"
          ? "flex h-16 items-center justify-center rounded-xl bg-primary/5 p-1"
          : "flex aspect-[3/2] items-center justify-center rounded-xl bg-primary/5 p-3"
      }
    >
      {row.image && !failed ? (
        <Image
          width={256}
          height={256}
          unoptimized
          src={row.image}
          alt={row.name}
          className={
            row.kind === "item"
              ? "size-14 max-w-full object-contain"
              : "h-full w-2/3 object-contain"
          }
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
type DetailsControl = {
  detailsOpen?: boolean;
  onDetailsOpenChange?: (open: boolean) => void;
};
function EvoDetails({
  row,
  detailsOpen,
  onDetailsOpenChange,
}: { row: InventoryRow } & DetailsControl) {
  const [localOpen, setLocalOpen] = useState(false);
  const open = detailsOpen ?? localOpen;
  const setOpen = onDetailsOpenChange ?? setLocalOpen;
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };
  const show = () => {
    cancelClose();
    setOpen(true);
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => {
      if (
        !trigger.current?.contains(document.activeElement) &&
        !panel.current?.contains(document.activeElement)
      )
        setOpen(false);
    }, 200);
  };
  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );
  const details = row.details;
  if (!details) return null;
  return (
    <Popover
      open={open}
      onOpenChange={(value) => {
        cancelClose();
        setOpen(value);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          ref={trigger}
          className="w-full rounded-lg border bg-background/60 px-2 py-2 text-sm font-semibold hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onMouseEnter={show}
          onMouseLeave={scheduleClose}
          onFocus={show}
          onClick={(event) => {
            event.preventDefault();
            show();
          }}
          data-testid="inventory-evo-details-trigger"
        >
          Stats and moves
        </button>
      </PopoverTrigger>
      <PopoverContent
        ref={panel}
        align="start"
        sideOffset={8}
        collisionPadding={16}
        aria-label={`${row.name} stats and moves`}
        className="w-[640px] max-w-[calc(100vw-32px)] max-h-[var(--radix-popover-content-available-height)] overflow-y-auto rounded-xl p-5 shadow-xl"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
        onFocusCapture={cancelClose}
        data-testid="inventory-evo-details"
      >
        <div className="mb-4 border-b pb-3">
          <h5 className="text-lg font-bold capitalize">
            {row.name}
            {row.displayId
              ? ` · ${row.displayId}`
              : row.tokenId && !row.name.includes(`#${row.tokenId}`)
                ? ` #${row.tokenId}`
                : ""}
          </h5>
          <p className="text-sm text-muted-foreground">
            Level {details.level} · HP {details.currentHealth}/
            {details.values.health} · {details.nature} · {details.gender}
          </p>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-5">
          <section className="min-w-0 space-y-3">
            <h6 className="text-sm font-bold">Battle stats</h6>
            <dl className="space-y-2 text-xs">
              <div className="grid grid-cols-[1fr_48px_64px] gap-2 text-muted-foreground">
                <dt>Stat</dt>
                <dd className="text-right">Now</dd>
                <dd className="text-right">Level 100</dd>
              </div>
              {statKeys
                .filter((k) => k !== "health")
                .map((k) => (
                  <div key={k} className="grid grid-cols-[1fr_48px_64px] gap-2">
                    <dt className="capitalize">{k}</dt>
                    <dd className="text-right font-semibold">
                      {details.values[k]}
                    </dd>
                    <dd className="text-right font-semibold">
                      {details.projected[k]}
                    </dd>
                  </div>
                ))}
            </dl>
            <p className="text-xs text-muted-foreground">
              Level 100 is a projection using this Evo’s current genes, nature
              and training.
            </p>
            <h6 className="pt-2 text-sm font-bold">
              Genetic ratings{" "}
              <span className="font-normal text-muted-foreground">/ 50</span>
            </h6>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              {statKeys
                .filter((k) => k !== "health" || details.geneticHealthAvailable)
                .map((k) => (
                  <div key={k} className="flex justify-between gap-2">
                    <dt className="capitalize">{k}</dt>
                    <dd className="font-semibold">{details.genetics[k]}</dd>
                  </div>
                ))}
            </dl>
          </section>
          <section className="min-w-0">
            <h6 className="mb-3 text-sm font-bold">Moves and unlock levels</h6>
            <ul className="space-y-2 text-xs">
              {details.moves.map((move) => (
                <li
                  key={move.id}
                  className={`rounded-lg border p-2 ${move.unlocked ? "bg-primary/5" : "text-muted-foreground"}`}
                >
                  <div className="flex justify-between gap-3">
                    <span className="font-semibold">{move.name}</span>
                    <span className="shrink-0">Level {move.level}</span>
                  </div>
                  <p className="mt-1">
                    {move.equipped
                      ? "Equipped"
                      : move.unlocked
                        ? "Available"
                        : "Locked"}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </PopoverContent>
    </Popover>
  );
}
export function InventoryCard({
  row,
  detailsOpen,
  onDetailsOpenChange,
}: { row: InventoryRow } & DetailsControl) {
  return (
    <li
      className={`min-w-0 space-y-2 rounded-xl border bg-muted/20 ${row.kind === "item" ? "p-2" : "p-3"}`}
      data-testid="inventory-card"
      data-kind={row.kind}
    >
      <InventoryArt key={row.image || row.id} row={row} />
      <h4
        className={`break-words font-bold capitalize ${row.kind === "item" ? "text-sm" : ""}`}
      >
        {row.name}
      </h4>
      {row.displayId && (
        <p className="text-xs text-muted-foreground">{row.displayId}</p>
      )}
      {row.details && (
        <>
          <p className="text-sm font-semibold">
            Level {row.details.level} · HP {row.details.currentHealth}/
            {row.details.values.health}
          </p>
          <EvoDetails
            row={row}
            detailsOpen={detailsOpen}
            onDetailsOpenChange={onDetailsOpenChange}
          />
        </>
      )}
      {row.kind === "item" ? (
        <p className="break-words text-xs">
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
        <p className="break-words text-xs capitalize text-muted-foreground">
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
  const [detailsId, setDetailsId] = useState<string | null>(null);
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
        <ul
          className={
            rows.every((row) => row.kind === "item")
              ? "grid grid-cols-1 items-start gap-3 @min-[176px]/inventory:grid-cols-2 @min-[364px]/inventory:grid-cols-4 @min-[552px]/inventory:grid-cols-6 @min-[740px]/inventory:grid-cols-8 @min-[928px]/inventory:grid-cols-10 @min-[1116px]/inventory:grid-cols-12"
              : "grid grid-cols-1 items-start gap-3 @min-[364px]/inventory:grid-cols-2 @min-[552px]/inventory:grid-cols-3 @min-[740px]/inventory:grid-cols-4 @min-[928px]/inventory:grid-cols-5 @min-[1116px]/inventory:grid-cols-6"
          }
        >
          {rows.map((row) => (
            <InventoryCard
              key={row.id}
              row={row}
              detailsOpen={detailsId === row.id}
              onDetailsOpenChange={(open) =>
                setDetailsId((current) =>
                  open ? row.id : current === row.id ? null : current,
                )
              }
            />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{empty}</p>
      )}
    </div>
  );
  return (
    <section
      className="@container/inventory space-y-5 rounded-2xl border bg-card p-5"
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
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,160px),1fr))] gap-3">
        <label className="min-w-0 space-y-1 text-sm font-semibold">
          Search
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Find an Evo or item"
            type="search"
          />
        </label>
        <label className="min-w-0 space-y-1 text-sm font-semibold">
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
        <label className="min-w-0 space-y-1 text-sm font-semibold">
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
          <label className="min-w-0 space-y-1 text-sm font-semibold">
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
