"use client";
import { HatchReveal, useHatchReveals } from "./hatch-reveal";
import { useNurseryAction, NurseryActionProgress } from "./action-progress";
import { useEvoApprovalPreference, EvoApprovalChoice } from "./approval-choice";
import { TestRandomness } from "./test-randomness";
import { startNurseryAudit, recordNurseryEvent } from "@/lib/nursery/audit-client";
import { nurseryAccessMessage } from "@/lib/nursery/access";
import { useEffect, useState } from "react";
import { isAddress, type Hex } from "viem";
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
  discoverNurseryEggs,
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
  const reveals = useHatchReveals(w.account?.address);
  const approval = useEvoApprovalPreference(hermannAddress!, w.account?.address);
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
    queryFn: async ({ signal }) => {
      const address = w.account?.address;
      if (!address || !isAddress(address)) throw new Error("Connect a valid wallet.");
      const onChain = await discoverNurseryEggs(address, signal);
      signal.throwIfAborted();
      // Indexed/remembered IDs retain recovery cards; ownership is rechecked by each tile.
      const result = await nurseryClient.multicall({
        allowFailure: true,
        contracts: ids.map((id) => ({
          address: hermannAddress!,
          abi: hermannAbi,
          functionName: "eggs",
          args: [BigInt(id)],
        })),
      });
      signal.throwIfAborted();
      const recovered = ids.filter((_, i) => {
        const r = result[i];
        return r?.status === "success" && [1, 2].includes((r.result as Egg)[5]);
      });
      return [...new Set([...onChain, ...recovered])];
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
        throw new Error("Enter a valid egg number.");
      if (!nurseryConfigured) throw new Error("The nursery is opening soon.");
      const attemptId = await startNurseryAudit({ action: "findEgg", wallet: w.account.address, args: [id], value: "0" });
      if (!sameAddress(await ownerOf(id), w.account.address))
        throw new Error("This egg belongs to a different wallet.");
      const egg = await readHermann<Egg>("eggs", [BigInt(id)]);
      if (![1, 2].includes(egg[5]))
        throw new Error(
          "This egg isn’t available to hatch.",
        );
      remembered.remember(id);
      await recordNurseryEvent({ attemptId, phase: "completed" });
      setToken("");
    });
  // A link from collecting an egg can recover it before the indexer catches up.
  useEffect(() => {
    const id = new URL(window.location.href).searchParams.get("egg");
    if (id && /^\d+$/.test(id)) setToken(id);
  }, []);
  return (
    <div className="space-y-6">
      {!w.canAct && <Notice>{nurseryAccessMessage}</Notice>}
      {!nurseryConfigured && (
        <Notice>
          Hatching opens soon.
        </Notice>
      )}
      <ConnectNursery connectedAddress={w.account?.address} />
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Your eggs</h2>
          <p className="text-sm text-muted-foreground">
            Choose an egg to treat or hatch.
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
              approval={approval}
              onSubmitted={reveals.remember}
              onView={id => reveals.remember(id)}
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
                : "No eggs yet. Visit Bertha to breed a pair."}
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
              Enter the egg number to check your wallet.
            </p>
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                void addEgg();
              }}
            >
              <Input
                aria-label="Egg number"
                inputMode="numeric"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Egg number"
              />
              <Button type="submit" disabled={!w.canAct || w.busy || !/^\d+$/.test(token)}>
                Find egg
              </Button>
            </form>
            <ErrorMessage message={w.error} />
          </CardContent>
        </Card>
      )}
      {w.account && reveals.records.length > 0 && <section className="space-y-3"><h3 className="text-lg font-bold">Your new Evos</h3><div className="flex flex-wrap gap-2">{reveals.records.slice(0, 12).map(record => <Button key={`${record.tokenId}:${record.hash}`} variant="outline" disabled={!w.canAct} onClick={() => reveals.reopen(record)}>View Evo #{record.tokenId}</Button>)}</div></section>}
      {w.canAct && w.account && reveals.pending && <HatchReveal key={`${nurseryScope}:${w.account.address}:${reveals.pending.tokenId}:${reveals.pending.hash}`} record={reveals.pending} owner={w.account.address} close={() => reveals.update(reveals.pending!, { dismissed: true })} celebrated={() => reveals.update(reveals.pending!, { celebrated: true })} />}
      {w.canAct && w.account && nurseryConfigured && (
        <details className="rounded-xl border p-4 text-sm">
          <summary className="cursor-pointer w-fit font-semibold">Wallet settings</summary>
          <div className="mt-3"><EvoApprovalChoice keeper="Hermann" {...approval} disabled={!approval.ready || w.busy} /></div>
        </details>
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
  onSubmitted,
  onView,
  approval,
}: {
  tokenId: string;
  asset?: SquidAsset;
  owner: string;
  untreatedOnly: boolean;
  approval: ReturnType<typeof useEvoApprovalPreference>;
  onSubmitted: (tokenId: string, hash: Hex) => void;
  onView: (tokenId: string) => void;
}) {
  const w = useNurseryWallet();
  const action = useNurseryAction();
  const actionKey = `${nurseryScope}:${owner.toLowerCase()}:${tokenId}`;
  const [confirmedTreatment, setConfirmedTreatment] = useState<string>();
  const [confirmedHatchRequest, setConfirmedHatchRequest] = useState<string>();
  const [confirmedHatch, setConfirmedHatch] = useState<string>();
  const now = useNow();
  const eggQuery = useEgg(tokenId, owner);
  const remembered = useRemembered("eggs", owner);
  const queryClient = useQueryClient();
  const egg = eggQuery.data?.egg;
  const treated = Boolean((egg ? egg[4] : asset?.metadata.type === "EGG" && asset.metadata.treated) || confirmedTreatment === actionKey);
  const awaitingHatch = confirmedHatchRequest === actionKey && egg?.[5] === 1;
  const genesis = eggQuery.data?.kind === 1;
  const incubation = genesis ? 0n : eggQuery.data?.incubation ?? INCUBATION;
  const cardAsset = asset?.metadata.type === "EGG" && egg
    ? { ...asset, metadata: { ...asset.metadata, treated, createdAt: egg[3] === 0n ? null : new Date(Number(egg[3]) * 1000).toISOString() } }
    : asset;
  const state = egg
    ? hatchState(egg[3], egg[5], treated, eggQuery.data!.fulfilled, now, incubation)
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
  const treat = () => action.execute("treat", w.run, async () => {
    if (!w.account || !approval.ready || !ready || treated || !state?.canTreat) return;
    await verifyOwner();
    const [fresh, price, duration] = await Promise.all([
      readHermann<Egg>("eggs", [BigInt(tokenId)]),
      readHermann<bigint>("TREAT_COST"),
      readHermann<bigint>("INCUBATION_TIME"),
    ]);
    if (fresh[5] !== 1 || fresh[4]) throw new Error("Treatment is no longer available for this egg.");
    if (price !== TREAT_COST || !genesis && duration !== incubation) throw new Error("The nursery rules changed. Please try again later.");
    let approvalNeeded = false;
    await approveEvo(w.account, hermannAddress!, TREAT_COST, verifyOwner, {
      persistent: approval.persistent,
      onRequired: () => { approvalNeeded = true; action.update({ kind: "treat", step: "approval", phase: "preparing" }); },
      onProgress: phase => action.update({ kind: "treat", step: "approval", phase }),
    });
    action.update({ kind: "treat", step: "action", phase: "preparing", approvalNeeded });
    await verifyOwner();
    await sendNurseryTransaction(w.account, hermannAddress!, hermannAbi, "treat", [BigInt(tokenId)], {
      beforeSend: verifyOwner,
      onProgress: phase => action.update({ kind: "treat", step: "action", phase, approvalNeeded }),
    });
    // A confirmed receipt updates the card immediately, even if a later RPC read lags.
    setConfirmedTreatment(actionKey);
    await refresh();
  });
  const hatch = () => {
    const kind = state?.canComplete ? "finish" : "hatch";
    return action.execute(kind, w.run, async () => {
      if (!w.account || !ready || !state || awaitingHatch) return;
      action.update({ kind, step: "action", phase: "preparing" });
      await verifyOwner();
      if (state.canComplete) {
        await sendNurseryTransaction(
          w.account,
          hermannAddress!,
          hermannAbi,
          "completeHatch",
          [BigInt(tokenId)],
          { beforeSend: verifyOwner, submitted: hash => onSubmitted(tokenId, hash), onProgress: phase => action.update({ kind, step: "action", phase }) },
        );
        setConfirmedHatch(actionKey);
      } else if (state.canRequest && quote.data) {
        const [current, fresh, block, duration] = await Promise.all([
          vrfQuote(hermannAddress!, hermannAbi),
          readHermann<Egg>("eggs", [BigInt(tokenId)]),
          nurseryClient.getBlock(),
          readHermann<bigint>("INCUBATION_TIME"),
        ]);
        if (
          !hatchState(fresh[3], fresh[5], fresh[4], false, block.timestamp, genesis ? 0n : duration)
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
            onProgress: phase => action.update({ kind, step: "action", phase }),
          },
        );
        setConfirmedHatchRequest(actionKey);
      }
      await refresh();
    });
  };
  if (eggQuery.data && !eggQuery.data.owned) return null;
  if (untreatedOnly && treated) return null;
  if (egg?.[5] === 3 || confirmedHatch === actionKey)
    return (
      <Card>
        <CardContent className="space-y-3">
          <Sparkles className="size-12 text-primary" />
          <p className="font-bold">Evo #{tokenId} has hatched!</p>
          <p className="text-sm text-muted-foreground">
            Meet your new Evo.
          </p>
          <Button disabled={!w.canAct} onClick={() => onView(tokenId)}>View Evo</Button>
        </CardContent>
      </Card>
    );
  return (
    <Card className="pt-0 overflow-hidden">
      <div className="bg-primary/5 p-4">
        {cardAsset?.metadata.type === "EGG" ? (
          <EvoCard asset={cardAsset} />
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
          <CardTitle>{!eggQuery.data || egg?.[5] === 0 ? "Egg" : genesis ? "OG egg" : "Egg"} #{tokenId}</CardTitle>
          <span
            className={`text-xs rounded-full px-2 py-1 ${treated ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
          >
            {treated ? "Treated" : "Untreated"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        {eggQuery.isLoading ? (
          <Loading>Checking your egg…</Loading>
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
              {egg![5] === 2 || awaitingHatch
                ? eggQuery.data!.fulfilled
                  ? "Ready to reveal"
                  : "Preparing your Evo…"
                : state!.remaining === 0n
                  ? "Ready to hatch"
                  : `Hatches in ${remainingTime(state!.remaining)}`}
            </p>
            {egg![5] === 1 && !genesis && (
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{
                    width: `${Math.max(0, Math.min(100, (Number(incubation - state!.remaining) / Number(incubation)) * 100))}%`,
                  }}
                />
              </div>
            )}
            <p className="min-h-[2lh] text-xs text-muted-foreground">
              {egg![5] === 2
                ? eggQuery.data?.fulfilled ? "Your Evo is ready. Reveal it below." : "This can take a moment."
                : treated
                  ? "Treatment applied."
                  : "Optional treatment boosts the chance of epic or chroma."}
            </p>
          </>
        )}
        {ready &&
          state?.canRequest &&
          (quote.isFetching ? (
            <Loading>Checking fee…</Loading>
          ) : quote.isError ? (
            <ErrorMessage message="Couldn’t check the fee. Try again shortly." />
          ) : (
            quote.data && (
              <VrfPrice quote={quote.data.quote} maximum={quote.data.maximum} />
            )
          ))}
        {egg?.[5] === 2 && <TestRandomness keeper="hermann" fulfilled={eggQuery.data?.fulfilled} requestId={egg[6]} refreshed={refresh} />}
        <div className="mt-auto flex flex-col gap-2">
          <Button
            className="min-w-0 bg-green-600 text-white hover:bg-green-700 disabled:opacity-100 disabled:bg-green-600/70 disabled:text-white"
            disabled={!w.canAct || !approval.ready || !ready || treated || !state?.canTreat || action.progress !== null || w.busy || eggQuery.isError}
            onClick={treat}
          >
            <Sparkles className="size-4" />
            {action.progress?.kind === "treat" ? action.copy!.button : treated ? "Treated" : `Treat · ${evoAmount(TREAT_COST)} EVO`}
          </Button>
          <Button
            disabled={
              !w.canAct ||
              !ready ||
              w.busy ||
              action.progress !== null ||
              awaitingHatch ||
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
            {action.progress && action.progress.kind !== "treat"
              ? action.copy!.button
              : state?.canComplete
                ? "Reveal Evo"
                : egg?.[5] === 2 || awaitingHatch
                  ? "Preparing…"
                  : "Hatch"}
          </Button>
        </div>
        <NurseryActionProgress progress={action.progress} />
        <ErrorMessage message={w.error} />
      </CardContent>
    </Card>
  );
}
