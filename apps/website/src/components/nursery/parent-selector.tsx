"use client";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { EvoCard } from "@workspace/evoverses/components/evo-card";
import { EvoImage } from "@workspace/evoverses/components/evo-image";
import { Plus, RefreshCw } from "lucide-react";
import { useState } from "react";
import { compatible, parentUnavailable } from "@/lib/nursery/rules";
import { type ParentOption } from "./hooks";
import { ErrorMessage, Loading } from "./shared";
export function ParentSelector({
  number,
  selected,
  first,
  options,
  now,
  disabled,
  loading,
  error,
  more,
  loadingMore,
  onMore,
  onSelect,
  retry,
}: {
  number: 1 | 2;
  selected?: ParentOption;
  first?: ParentOption;
  options: ParentOption[];
  now: bigint;
  disabled: boolean;
  loading: boolean;
  error?: string;
  more?: boolean;
  loadingMore?: boolean;
  onMore: () => void;
  onSelect: (option: ParentOption) => void;
  retry: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const choices = options.filter(
    (option) =>
      (number === 1 || (first && compatible(first.parent, option.parent))) &&
      `${option.asset.tokenId} ${option.asset.metadata.species}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <section className="flex flex-col rounded-2xl border bg-card p-5 gap-4">
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-lg">Parent {number}</h2>
        <span className="text-xs text-muted-foreground">
          {number === 1 ? "Choose first" : "Compatible matches"}
        </span>
      </div>
      {selected ? (
        <div className="mx-auto w-full max-w-64">
          <EvoCard asset={selected.asset} />
          <p className="text-center text-sm capitalize mt-3">
            {selected.asset.metadata.species} #{selected.asset.tokenId}
          </p>
          {parentUnavailable(selected.parent, now) && (
            <ErrorMessage message={parentUnavailable(selected.parent, now)} />
          )}
        </div>
      ) : (
        <button
          disabled={disabled}
          onClick={() => setOpen(true)}
          className="min-h-72 flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 disabled:opacity-45 disabled:cursor-not-allowed"
        >
          <span className="rounded-full bg-primary/10 p-4">
            <Plus className="size-7 text-primary" />
          </span>
          <span className="font-bold">
            {number === 2 && !first ? "Choose parent 1 first" : "Select an Evo"}
          </span>
          <span className="text-sm text-muted-foreground px-4 text-center">
            {number === 1
              ? "Your wallet’s adult Evos"
              : "Opposite gender · A shared element"}
          </span>
        </button>
      )}
      <Button
        variant={selected ? "outline" : "default"}
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        {selected && <RefreshCw className="size-4" />}
        {selected ? "Change Evo" : "Select Evo"}
      </Button>
      <Dialog open={open && !disabled} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[85dvh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {number === 1
                ? "Choose your first Evo"
                : `Find a partner for #${first?.asset.tokenId}`}
            </DialogTitle>
            <DialogDescription>
              {number === 1
                ? "Choose an adult Evo from your connected wallet."
                : "Only different Evos with the opposite gender and a shared element appear here."}
            </DialogDescription>
          </DialogHeader>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search species or token number"
            aria-label="Search your Evos"
          />
          <div className="overflow-y-auto min-h-0 space-y-4">
            {loading ? (
              <Loading />
            ) : error ? (
              <>
                <ErrorMessage message={error} />
                <Button variant="outline" onClick={retry}>
                  Try again
                </Button>
              </>
            ) : choices.length ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {choices.map((option) => {
                  const reason = parentUnavailable(option.parent, now);
                  return (
                    <button
                      key={option.asset.tokenId}
                      disabled={Boolean(reason)}
                      onClick={() => {
                        onSelect(option);
                        setOpen(false);
                        setSearch("");
                      }}
                      className="rounded-xl border p-3 text-left hover:border-primary hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <EvoImage
                        asset={option.asset}
                        className="w-full rounded-lg"
                      />
                      <p className="font-bold text-sm capitalize">
                        {option.asset.metadata.species} #{option.asset.tokenId}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Gen {String(option.parent.generation)} ·{" "}
                        {option.parent.gender === 1 ||
                        option.parent.gender === "male"
                          ? "Male"
                          : "Female"}
                      </p>
                      <p className="text-xs mt-1 text-primary">
                        {reason ?? "Ready to breed"}
                      </p>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="py-8 text-center text-muted-foreground">
                {search
                  ? "No Evos match your search."
                  : number === 2
                    ? "No compatible partners on this page. Try loading more Evos or changing the first parent."
                    : "No adult Evos available in this wallet."}
              </p>
            )}
            {more && (
              <Button
                variant="outline"
                className="w-full"
                disabled={loadingMore}
                onClick={onMore}
              >
                {loadingMore ? "Loading…" : "Load more Evos"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
