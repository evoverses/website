"use client";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { EvoCard } from "@workspace/evoverses/components/evo-card";
import type { SquidAsset } from "@workspace/evoverses/lib/asset/types";
import { Egg as EggIcon, Sparkles, Clock } from "lucide-react";
import {
  useNurseryWallet,
  useNow,
  useOwnedEvos,
  useRemembered,
  useEgg,
} from "./hooks";
import {
  approveEvo,
  hermannAddress,
  hermannAbi,
  nurseryConfigured,
  nurseryScope,
  nurseryClient,
  ownerOf,
  sameAddress,
  readHermann,
  sendNurseryTransaction,
  verifyNursery,
  vrfQuote,
  type Egg,
} from "@/lib/nursery/contracts";
import {
  hatchState,
  remainingTime,
  TREAT_COST,
  INCUBATION,
} from "@/lib/nursery/rules";
import {
  ConnectNursery,
  ErrorMessage,
  Loading,
  Notice,
  VrfPrice,
  evoAmount,
} from "./shared";
import { NativeCredits } from "./native-credits";
export function Hatchery() {
  const w = useNurseryWallet();
  const owned = useOwnedEvos(w.account?.address);
  const remembered = useRemembered("eggs", w.account?.address);
  const [search, setSearch] = useState("");
  const [token, setToken] = useState("");
  const [filter, setFilter] = useState<"all" | "untreated">("all");
  useEffect(() => {
    setToken("");
    setSearch("");
  }, [w.account?.address]);
  const ids = [
    ...new Set([
      ...owned.assets.map((asset) => asset.tokenId),
      ...remembered.values,
    ]),
  ];
  const registry = useQuery({
    queryKey: ["nursery-egg-list", nurseryScope, w.account?.address, ids],
    enabled: nurseryConfigured && Boolean(w.account),
    refetchInterval: 15_000,
    queryFn: async () => {
      const result = await nurseryClient.multicall({
        allowFailure: true,
        contracts: ids.map((id) => ({
          address: hermannAddress!,
          abi: hermannAbi,
          functionName: "eggs",
          args: [BigInt(id)],
        })),
      });
      return ids.filter((_, i) => {
        const r = result[i];
        return r?.status === "success" && [1, 2].includes((r.result as Egg)[5]);
      });
    },
  });
  const indexedEggs = owned.assets
    .filter((asset) => asset.metadata.type === "EGG")
    .map((asset) => asset.tokenId);
  const eggIds = [
    ...new Set([...(registry.data ?? []), ...indexedEggs]),
  ].filter((id) => {
    const asset = owned.assets.find((a) => a.tokenId === id);
    return `${id} ${asset?.metadata.species ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase());
  });
  const addEgg = (id = token) =>
    w.run(async () => {
      if (!w.account || !/^\d+$/.test(id))
        throw new Error("Enter a valid egg token number.");
      if (!nurseryConfigured) throw new Error("The nursery is opening soon.");
      if (!sameAddress(await ownerOf(id), w.account.address))
        throw new Error("This egg belongs to a different wallet.");
      const egg = await readHermann<Egg>("eggs", [BigInt(id)]);
      if (![1, 2].includes(egg[5]))
        throw new Error(
          "This token is not an incubating egg at Hermann’s nursery.",
        );
      remembered.remember(id);
      setToken("");
    });
  // A link from collecting an egg can recover it before the indexer catches up.
  useEffect(() => {
    const id = new URL(window.location.href).searchParams.get("egg");
    if (id && /^\d+$/.test(id)) setToken(id);
  }, []);
  return (
    <div className="space-y-6">
      {!nurseryConfigured && (
        <Notice>
          The Nursery is opening soon. Hermann will be ready to treat and hatch
          eggs when it opens.
        </Notice>
      )}
      <ConnectNursery connectedAddress={w.account?.address} />
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Your eggs</h2>
          <p className="text-sm text-muted-foreground">
            Three days to hatch · Optional treatment: 250 EVO
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            aria-label="Search eggs"
            placeholder="Search egg number or species"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:w-64"
          />
          <Button
            variant={filter === "untreated" ? "default" : "outline"}
            onClick={() => setFilter(filter === "all" ? "untreated" : "all")}
          >
            Untreated
          </Button>
        </div>
      </div>
      {w.account && (owned.isLoading || registry.isLoading) && (
        <Loading>Loading your eggs…</Loading>
      )}
      {w.account && (owned.isError || registry.isError) && (
        <>
          <ErrorMessage message="Some eggs could not be loaded. Retry to see your full nursery." />
          <Button
            variant="outline"
            onClick={() => {
              void owned.refetch();
              void registry.refetch();
            }}
          >
            Try again
          </Button>
        </>
      )}
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {w.account &&
          eggIds.map((id) => (
            <EggTile
              key={`${w.account!.address}:${id}`}
              tokenId={id}
              asset={owned.assets.find((a) => a.tokenId === id)}
              owner={w.account!.address}
              untreatedOnly={filter === "untreated"}
            />
          ))}
      </div>
      {w.account &&
        !owned.isLoading &&
        !registry.isLoading &&
        !owned.isError &&
        !registry.isError &&
        eggIds.length === 0 && (
          <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
            <EggIcon className="size-10 mx-auto mb-3 text-primary/60" />
            <p>
              {search
                ? "No eggs match your search."
                : "No eggs in your nursery yet. Visit Bertha to breed your first pair."}
            </p>
          </div>
        )}
      {owned.hasNextPage && (
        <Button
          variant="outline"
          disabled={owned.isFetchingNextPage}
          onClick={() => {
            void owned.fetchNextPage();
          }}
        >
          {owned.isFetchingNextPage ? "Loading…" : "Load more Evos & eggs"}
        </Button>
      )}
      {w.account && nurseryConfigured && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              An egg hasn’t appeared yet?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Enter its token number to check your wallet directly. Recently
              collected eggs can take a little time to appear.
            </p>
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                void addEgg();
              }}
            >
              <Input
                aria-label="Egg token number"
                inputMode="numeric"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Egg token number"
              />
              <Button type="submit" disabled={w.busy || !/^\d+$/.test(token)}>
                Find egg
              </Button>
            </form>
            <ErrorMessage message={w.error} />
          </CardContent>
        </Card>
      )}
      {w.account && nurseryConfigured && <NativeCredits keeper="hermann" />}
    </div>
  );
}
function EggTile({
  tokenId,
  asset,
  owner,
  untreatedOnly,
}: {
  tokenId: string;
  asset?: SquidAsset;
  owner: string;
  untreatedOnly: boolean;
}) {
  const w = useNurseryWallet();
  const now = useNow();
  const eggQuery = useEgg(tokenId, owner);
  const remembered = useRemembered("eggs", owner);
  const queryClient = useQueryClient();
  const egg = eggQuery.data?.egg;
  const state = egg
    ? hatchState(egg[3], egg[5], egg[4], eggQuery.data!.fulfilled, now)
    : null;
  const quote = useQuery({
    queryKey: ["nursery-hatch-quote", nurseryScope, tokenId, owner],
    enabled: Boolean(
      nurseryConfigured && eggQuery.data?.owned && state?.canRequest,
    ),
    refetchInterval: 20_000,
    queryFn: async () => {
      await verifyNursery();
      return vrfQuote(hermannAddress!, hermannAbi);
    },
  });
  const ready = nurseryConfigured && eggQuery.data?.owned;
  const treated = egg
    ? egg[4]
    : asset?.metadata.type === "EGG" && asset.metadata.treated;
  const isSupported = egg && [1, 2, 3].includes(egg[5]);
  const verifyOwner = async () => {
    await w.guard();
    if (!w.account || !sameAddress(await ownerOf(tokenId), w.account.address))
      throw new Error("This egg is no longer in your wallet.");
  };
  const refresh = async () => {
    await eggQuery.refetch();
    await queryClient.invalidateQueries({ queryKey: ["nursery-egg-list"] });
    await queryClient.invalidateQueries({ queryKey: ["nursery-owned"] });
  };
  const treat = () =>
    w.run(async () => {
      if (!w.account || !ready || !state?.canTreat) return;
      await verifyOwner();
      const [fresh, price, duration] = await Promise.all([
        readHermann<Egg>("eggs", [BigInt(tokenId)]),
        readHermann<bigint>("TREAT_COST"),
        readHermann<bigint>("INCUBATION_TIME"),
      ]);
      if (fresh[5] !== 1 || fresh[4])
        throw new Error("Treatment is no longer available for this egg.");
      if (price !== TREAT_COST || duration !== INCUBATION)
        throw new Error("The nursery rules changed. Please try again later.");
      await approveEvo(w.account, hermannAddress!, TREAT_COST, verifyOwner);
      await verifyOwner();
      await sendNurseryTransaction(
        w.account,
        hermannAddress!,
        hermannAbi,
        "treat",
        [BigInt(tokenId)],
        { beforeSend: verifyOwner },
      );
      await refresh();
    });
  const hatch = () =>
    w.run(async () => {
      if (!w.account || !ready || !state) return;
      await verifyOwner();
      if (state.canComplete) {
        await sendNurseryTransaction(
          w.account,
          hermannAddress!,
          hermannAbi,
          "completeHatch",
          [BigInt(tokenId)],
          { beforeSend: verifyOwner },
        );
      } else if (state.canRequest && quote.data) {
        const [current, fresh, block] = await Promise.all([
          vrfQuote(hermannAddress!, hermannAbi),
          readHermann<Egg>("eggs", [BigInt(tokenId)]),
          nurseryClient.getBlock(),
        ]);
        if (
          !hatchState(fresh[3], fresh[5], fresh[4], false, block.timestamp)
            .canRequest
        )
          throw new Error("This egg is not ready to hatch yet.");
        if (current.quote > quote.data.maximum)
          throw new Error("The surcharge changed. Refresh before hatching.");
        await sendNurseryTransaction(
          w.account,
          hermannAddress!,
          hermannAbi,
          "requestHatch",
          [BigInt(tokenId)],
          {
            value: quote.data.maximum,
            gasPrice: current.gasPrice,
            beforeSend: verifyOwner,
            submitted: () => remembered.remember(tokenId),
          },
        );
      }
      await refresh();
    });
  if (eggQuery.data && !eggQuery.data.owned) return null;
  if (untreatedOnly && treated) return null;
  if (egg?.[5] === 3)
    return (
      <Card>
        <CardContent className="space-y-3">
          <Sparkles className="size-12 text-primary" />
          <p className="font-bold">Evo #{tokenId} has hatched!</p>
          <p className="text-sm text-muted-foreground">
            Its card will update as the collection refreshes.
          </p>
        </CardContent>
      </Card>
    );
  return (
    <Card className="pt-0 overflow-hidden">
      <div className="bg-primary/5 p-4">
        {asset?.metadata.type === "EGG" ? (
          <EvoCard asset={asset} />
        ) : (
          <div className="aspect-square flex flex-col items-center justify-center gap-4">
            <EggIcon className="size-24 text-primary/70" />
            <p className="text-sm text-muted-foreground">
              A new Evo is on its way
            </p>
          </div>
        )}
      </div>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Egg #{tokenId}</CardTitle>
          <span
            className={`text-xs rounded-full px-2 py-1 ${treated ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
          >
            {treated ? "Treated" : "Untreated"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {eggQuery.isLoading ? (
          <Loading>Checking incubation…</Loading>
        ) : eggQuery.isError ? (
          <>
            <ErrorMessage message="Egg status could not be checked." />
            <Button
              variant="outline"
              onClick={() => {
                void eggQuery.refetch();
              }}
            >
              Retry
            </Button>
          </>
        ) : !nurseryConfigured ? (
          <p className="text-sm text-muted-foreground">
            Hermann is getting ready.
          </p>
        ) : !isSupported ? (
          <p className="text-sm text-muted-foreground">
            This egg is not supported by this nursery yet.
          </p>
        ) : (
          <>
            <p className="text-sm flex gap-2 items-center">
              <Clock className="size-4" />
              {egg![5] === 2
                ? eggQuery.data!.fulfilled
                  ? "Ready to finish hatching"
                  : "Waiting for randomness"
                : state!.remaining === 0n
                  ? "Ready to hatch"
                  : `Hatches in ${remainingTime(state!.remaining)}`}
            </p>
            {egg![5] === 1 && (
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{
                    width: `${Math.max(0, Math.min(100, (Number(INCUBATION - state!.remaining) / Number(INCUBATION)) * 100))}%`,
                  }}
                />
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {egg![5] === 2
                ? "Treatment is locked while your Evo’s traits are being decided."
                : treated
                  ? "Treatment applied. Your egg is all set."
                  : "Treatment doubles the chance of epic and chroma rolls. It is optional."}
            </p>
          </>
        )}
        {ready &&
          state?.canRequest &&
          (quote.isFetching ? (
            <Loading>Checking surcharge…</Loading>
          ) : quote.isError ? (
            <ErrorMessage message="The surcharge could not be checked. Please try again shortly." />
          ) : (
            quote.data && (
              <VrfPrice quote={quote.data.quote} maximum={quote.data.maximum} />
            )
          ))}
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            disabled={!ready || !state?.canTreat || w.busy || eggQuery.isError}
            onClick={treat}
          >
            <Sparkles className="size-4" />
            {treated ? "Treated" : `Treat · ${evoAmount(TREAT_COST)} EVO`}
          </Button>
          <Button
            disabled={
              !ready ||
              w.busy ||
              eggQuery.isError ||
              (!state?.canComplete &&
                (!state?.canRequest ||
                  !quote.data ||
                  quote.isFetching ||
                  quote.isError))
            }
            onClick={hatch}
          >
            <EggIcon className="size-4" />
            {w.busy
              ? "Confirm in your wallet…"
              : state?.canComplete
                ? "Finish hatching"
                : egg?.[5] === 2
                  ? "Hatching…"
                  : "Hatch"}
          </Button>
        </div>
        <ErrorMessage message={w.error} />
      </CardContent>
    </Card>
  );
}
