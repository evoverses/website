"use client";
import { useNurseryAction, NurseryActionProgress } from "./action-progress";
import { useEvoApprovalPreference, EvoApprovalChoice } from "./approval-choice";
import { TestRandomness } from "./test-randomness";
import { startNurseryAudit, recordNurseryEvent } from "@/lib/nursery/audit-client";
import { nurseryChain } from "@/lib/nursery/network";
import { nurseryAccessMessage } from "@/lib/nursery/access";
import { breedingTransactionsApproved, breedingApprovalMessage, requireBreedingApproval } from "@/lib/beta/release-policy";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Heart, Egg, ArrowRight } from "lucide-react";
import { type Hex } from "viem";
import { breedHatchProgress } from "@/lib/nursery/breed-hatch-progress";
import { breedingRequest } from "@/lib/nursery/events";
import { submitBreed } from "@/lib/nursery/actions";
import {
  approveEvo,
  berthaAddress,
  berthaAbi,
  nurseryConfigured,
  nurseryScope,
  nurseryClient,
  readBertha,
  readHermann,
  sameAddress,
  sendNurseryTransaction,
  verifyNursery,
  vrfQuote,
  type BreedRequest,
  type Egg as NurseryEgg,
} from "@/lib/nursery/contracts";
import { parentCost, parentUnavailable, compatible } from "@/lib/nursery/rules";
import {
  useNurseryWallet,
  useNow,
  useOwnedEvos,
  useParents,
  useRemembered,
  type ParentOption,
} from "./hooks";
import {
  ConnectNursery,
  ErrorMessage,
  Loading,
  Notice,
  VrfPrice,
} from "./shared";
import { BreedingPrice } from "./breeding-price";
import { ParentSelector } from "./parent-selector";
import { NativeCredits } from "./native-credits";

export function Breeder() {
  const w = useNurseryWallet();
  const action = useNurseryAction();
  const approval = useEvoApprovalPreference(berthaAddress!, w.account?.address);
  const now = useNow();
  const queryClient = useQueryClient();
  const owned = useOwnedEvos(w.account?.address);
  const parents = useParents(owned.assets, w.account?.address);
  const history = useRemembered("breeds", w.account?.address);
  const [recoverHash, setRecoverHash] = useState("");
  const [firstId, setFirstId] = useState<string>();
  const [secondId, setSecondId] = useState<string>();
  const first = parents.data?.find((p) => p.asset.tokenId === firstId);
  const second = parents.data?.find((p) => p.asset.tokenId === secondId);
  useEffect(() => {
    setFirstId(undefined);
    setSecondId(undefined);
    setRecoverHash("");
  }, [w.account?.address]);
  const validPair =
    first &&
    second &&
    compatible(first.parent, second.parent) &&
    !parentUnavailable(first.parent, now) &&
    !parentUnavailable(second.parent, now);
  const quote = useQuery({
    queryKey: [
      "nursery-breed-quote",
      nurseryScope,
      w.account?.address,
      firstId,
      secondId,
      first?.parent.totalBreeds.toString(),
      second?.parent.totalBreeds.toString(),
    ],
    enabled: Boolean(nurseryConfigured && w.account && validPair),
    refetchInterval: 20_000,
    queryFn: async () => {
      await verifyNursery();
      const [preview, vrf] = await Promise.all([
        readHermann<readonly [bigint, bigint]>("previewBreed", [
          BigInt(firstId!),
          BigInt(secondId!),
          w.account!.address,
        ]),
        vrfQuote(berthaAddress!, berthaAbi),
      ]);
      return { cost: preview[0], ...vrf };
    },
  });
  const calculated = validPair
    ? parentCost(first.parent) + parentCost(second.parent)
    : null;
  const priceMatches = quote.data && calculated === quote.data.cost;
  const breedUnavailable = !w.canAct
    ? nurseryAccessMessage
    : !breedingTransactionsApproved
    ? breedingApprovalMessage
    : !nurseryConfigured
    ? "Breeding opens soon."
    : !w.account
      ? "Connect your wallet to breed."
      : !first || !second
        ? "Choose both parents to breed."
        : !validPair
          ? "Choose two Evos that are ready to breed."
          : quote.isFetching
            ? "Checking price…"
            : quote.isError
              ? "Refresh the price to continue."
              : !priceMatches
                ? "Refresh your Evos to check the price."
                : w.busy
                  ? "Complete the current step in your wallet."
                  : undefined;
  const breed = () =>
    action.execute("breed", w.run, async () => {
      requireBreedingApproval();
      if (!w.account || !approval.ready || !first || !second || !quote.data || !priceMatches)
        return;
      const account = w.account;
      let approvalNeeded = false;
      await submitBreed(quote.data, {
        guard: w.guard,
        preview: async () =>
          (
            await readHermann<readonly [bigint, bigint]>("previewBreed", [
              BigInt(first.asset.tokenId),
              BigInt(second.asset.tokenId),
              account.address,
            ])
          )[0],
        approve: (cost) => approveEvo(account, berthaAddress!, cost, w.guard, {
          persistent: approval.persistent,
          onRequired: () => { approvalNeeded = true; action.update({ kind: "breed", step: "approval", phase: "preparing" }); },
          onProgress: phase => action.update({ kind: "breed", step: "approval", phase }),
        }),
        quote: async () => { action.update({ kind: "breed", step: "action", phase: "preparing", approvalNeeded }); return vrfQuote(berthaAddress!, berthaAbi); },
        send: (payment) =>
          sendNurseryTransaction(
            account,
            berthaAddress!,
            berthaAbi,
            "breed",
            [
              BigInt(first.asset.tokenId),
              BigInt(second.asset.tokenId),
              payment.cost,
            ],
            {
              value: payment.value,
              gasPrice: payment.gasPrice,
              beforeSend: w.guard,
              onProgress: phase => action.update({ kind: "breed", step: "action", phase, approvalNeeded }),
              submitted: (hash) => {
                history.remember(hash);
                setFirstId(undefined);
                setSecondId(undefined);
              },
            },
          ),
      });
      await queryClient.invalidateQueries({ queryKey: ["nursery-parents"] });
    });
  const recover = () =>
    w.run(async () => {
      if (!w.account || !/^0x[\da-fA-F]{64}$/.test(recoverHash))
        throw new Error("Enter a valid breeding transaction hash.");
      const attemptId = await startNurseryAudit({ action: "recoverBreed", wallet: w.account.address, args: [recoverHash], value: "0" });
      const receipt = await nurseryClient.getTransactionReceipt({
        hash: recoverHash as Hex,
      });
      const belongs =
        receipt.status === "success" &&
        receipt.logs.some(
          (log) =>
            breedingRequest(log, berthaAddress!, w.account!.address) !== null,
        );
      if (!belongs)
        throw new Error(
          "This transaction is not a breeding request from this wallet.",
        );
      history.remember(recoverHash);
      await recordNurseryEvent({ attemptId, phase: "completed", transactionHash: recoverHash });
      setRecoverHash("");
    });
  const selector = (number: 1 | 2, selected?: ParentOption) => (
    <ParentSelector
      number={number}
      selected={selected}
      first={first}
      options={parents.data ?? []}
      now={now}
      disabled={!w.account || w.busy || (number === 2 && !first)}
      loading={owned.isLoading || parents.isLoading}
      error={
        owned.isError || parents.isError
          ? "Your Evos could not be loaded. Please try again."
          : undefined
      }
      more={owned.hasNextPage}
      loadingMore={owned.isFetchingNextPage}
      onMore={() => {
        void owned.fetchNextPage();
      }}
      retry={() => {
        void owned.refetch();
        void parents.refetch();
      }}
      onSelect={(p) => {
        if (number === 1) {
          setFirstId(p.asset.tokenId);
          setSecondId(undefined);
        } else setSecondId(p.asset.tokenId);
      }}
    />
  );
  return (
    <div className="space-y-6">
      {!w.canAct && <Notice>{nurseryAccessMessage}</Notice>}
      {!nurseryConfigured && (
        <Notice>
          Breeding opens soon. You can preview prices for now.
        </Notice>
      )}
      <ConnectNursery connectedAddress={w.account?.address} />
      <div className="grid md:grid-cols-[1fr_auto_1fr] gap-4 items-stretch">
        {selector(1, first)}
        <div className="hidden md:flex items-center justify-center">
          <Heart className="size-7 text-primary" aria-hidden="true" />
        </div>
        {selector(2, second)}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Breeding cost</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <BreedingPrice parents={first && second ? [first.parent, second.parent] : undefined} />
          {quote.isFetching && validPair && nurseryConfigured ? (
            <Loading>Checking price…</Loading>
          ) : validPair && quote.isError ? (
            <>
              <ErrorMessage message="Couldn’t check this pair. Refresh your Evos and try again." />
              <Button
                variant="outline"
                onClick={() => {
                  void quote.refetch();
                  void parents.refetch();
                }}
              >
                Refresh price
              </Button>
            </>
          ) : (
            validPair &&
            quote.data && (
              <VrfPrice quote={quote.data.quote} maximum={quote.data.maximum} />
            )
          )}
          {validPair && quote.data && !priceMatches && (
            <Notice>
              The price changed. Refresh your Evos to continue.
            </Notice>
          )}
          <EvoApprovalChoice keeper="Bertha" {...approval} disabled={!w.canAct || !w.account || !approval.ready || w.busy || action.progress !== null} />
          <NurseryActionProgress progress={action.progress} />
          <ErrorMessage message={w.error} />
          <Button
            className="w-full sm:w-auto min-w-48 font-bold"
            size="lg"
            aria-describedby={breedUnavailable ? "breed-availability" : undefined}
            disabled={
              !w.canAct ||
              !approval.ready ||
              !breedingTransactionsApproved ||
              !nurseryConfigured ||
              !w.account ||
              !validPair ||
              !priceMatches ||
              quote.isFetching ||
              quote.isError ||
              w.busy
            }
            onClick={breed}
          >
            <Egg className="size-5" />
            {action.copy ? action.copy.button : "Breed"}
          </Button>
          {breedUnavailable && (
            <p id="breed-availability" className="text-sm text-muted-foreground">
              {breedUnavailable}
            </p>
          )}

        </CardContent>
      </Card>
      {w.account && history.values.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold">Your breeding</h2>
          {history.values.map((hash) => (
            <BreedProgress
              key={`${w.account!.address}:${hash}`}
              hash={hash as Hex}
              owner={w.account!.address}
            />
          ))}
        </section>
      )}
      {w.account && nurseryConfigured && (
        <details className="rounded-xl border p-4">
          <summary className="text-sm font-bold cursor-pointer">
            Find a previous breed
          </summary>
          <p className="text-sm text-muted-foreground mt-3">
            Paste the transaction hash from your wallet.
          </p>
          <form
            className="flex gap-2 mt-3"
            onSubmit={(event) => {
              event.preventDefault();
              void recover();
            }}
          >
            <Input
              aria-label="Breeding transaction hash"
              placeholder="0x…"
              value={recoverHash}
              onChange={(event) => setRecoverHash(event.target.value)}
            />
            <Button
              disabled={!w.canAct || w.busy || !/^0x[\da-fA-F]{64}$/.test(recoverHash)}
              type="submit"
            >
              Find breed
            </Button>
          </form>
        </details>
      )}
      {w.account && nurseryConfigured && <NativeCredits keeper="bertha" />}
      <p className="text-sm text-muted-foreground flex items-center gap-2">
        Already have an egg?
        <Link
          className="text-primary font-bold inline-flex gap-1 items-center"
          href="/nursery/hermann"
        >
          Visit Hermann
          <ArrowRight className="size-4" />
        </Link>
      </p>
    </div>
  );
}
function BreedProgress({ hash, owner }: { hash: Hex; owner: string }) {
  const w = useNurseryWallet();
  const eggs = useRemembered("eggs", owner);
  const queryClient = useQueryClient();
  const receipt = useQuery({
    queryKey: ["nursery-breed-receipt", nurseryScope, hash],
    staleTime: Infinity,
    enabled: nurseryConfigured,
    refetchInterval: (query) => (query.state.data ? false : 5_000),
    queryFn: async () => {
      try {
        return await nurseryClient.getTransactionReceipt({ hash });
      } catch (e) {
        if (e instanceof Error && e.name === "TransactionReceiptNotFoundError")
          return null;
        throw e;
      }
    },
  });
  const requestId =
    receipt.data?.logs
      .map((log) => breedingRequest(log, berthaAddress!, owner))
      .find((id) => id !== null) ?? undefined;
  const request = useQuery({
    queryKey: [
      "nursery-breed-progress",
      nurseryScope,
      requestId?.toString(),
      owner,
    ],
    enabled: requestId !== undefined,
    refetchInterval: 5_000,
    queryFn: async () => {
      const data = await readBertha<BreedRequest>("requests", [requestId!]);
      if (!sameAddress(data[0], owner))
        throw new Error("This request belongs to a different wallet.");
      const random =
        data[8] === 2
          ? await readBertha<readonly [boolean, boolean, bigint]>(
              "randomness",
              [data[6]],
            )
          : null;
      return { data, fulfilled: random?.[1] ?? false };
    },
  });
  const data = request.data?.data;
  const completedEgg = data?.[8] === 3 ? data[7].toString() : undefined;
  const now = useNow();
  const hatch = useQuery({
    queryKey: ["nursery-breed-hatch-progress", nurseryScope, completedEgg],
    enabled: Boolean(completedEgg),
    refetchInterval: (query) => query.state.data?.egg[5] === 3 ? false : 10_000,
    queryFn: async () => {
      const [egg, incubation] = await Promise.all([
        readHermann<NurseryEgg>("eggs", [BigInt(completedEgg!)]),
        readHermann<bigint>("INCUBATION_TIME"),
      ]);
      const fulfilled = egg[5] === 2
        ? (await readHermann<readonly [boolean, boolean, bigint]>("randomness", [egg[6]]))[1]
        : false;
      // Reject unrecorded/unknown states instead of describing an old breeding receipt as current progress.
      breedHatchProgress(egg, fulfilled, now, incubation);
      return { egg, incubation, fulfilled };
    },
  });
  const hatchProgress = !hatch.isError && hatch.data
    ? breedHatchProgress(hatch.data.egg, hatch.data.fulfilled, now, hatch.data.incubation)
    : undefined;
  const rememberEgg = eggs.remember;
  useEffect(() => {
    if (completedEgg) rememberEgg(completedEgg);
  }, [completedEgg, rememberEgg]);
  const complete = () =>
    w.run(async () => {
      requireBreedingApproval();
      if (!w.account || !requestId) return;
      await w.guard();
      await sendNurseryTransaction(
        w.account,
        berthaAddress!,
        berthaAbi,
        "completeBreed",
        [requestId],
        { beforeSend: w.guard },
      );
      await request.refetch();
      await queryClient.invalidateQueries({ queryKey: ["nursery-owned"] });
      await queryClient.invalidateQueries({ queryKey: ["nursery-parents"] });
    });
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3" aria-live="polite">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <p className="font-bold">
          {requestId
            ? `Breed #${requestId}`
            : "Breeding transaction"}
        </p>
        <a
          className="text-xs text-primary"
          href={`${nurseryChain.blockExplorers.default.url}/tx/${hash}`}
          target="_blank"
          rel="noreferrer"
        >
          View transaction
        </a>
      </div>
      {receipt.isError || request.isError ? (
        <>
          <ErrorMessage message="Couldn’t check this breed. It’s saved — try checking again." />
          <Button
            variant="outline"
            onClick={() => {
              void receipt.refetch();
              void request.refetch();
            }}
          >
            Check again
          </Button>
        </>
      ) : receipt.data?.status === "reverted" ? (
        <p>Breeding failed. Your EVO wasn’t spent.</p>
      ) : !receipt.data ? (
        <Loading>Confirming your transaction…</Loading>
      ) : requestId === undefined ? (
        <ErrorMessage message="This transaction is not a breeding request from this wallet." />
      ) : data?.[8] === 3 ? (
        hatch.isError ? (
          <div className="space-y-2">
            <ErrorMessage message={`Couldn’t check Egg #${completedEgg}. Try again.`} />
            <Button variant="outline" onClick={() => void hatch.refetch()}>Check again</Button>
          </div>
        ) : hatchProgress ? (
          <div className="space-y-2">
            <p className="text-primary font-bold">{hatchProgress.title} · {hatchProgress.complete ? "Evo" : "Egg"} #{completedEgg}</p>
            <p className="text-sm text-muted-foreground">{hatchProgress.advice}</p>
            {!hatchProgress.complete && <Link className="text-sm text-primary underline" href={`/nursery/hermann?egg=${completedEgg}`}>Visit Hermann</Link>}
          </div>
        ) : <Loading>Checking Egg #{completedEgg}…</Loading>
      ) : request.data?.fulfilled ? (
        <>
          <p>
            Your egg is ready to collect.
          </p>
          <Button disabled={!w.canAct || !breedingTransactionsApproved || w.busy} title={!breedingTransactionsApproved ? breedingApprovalMessage : undefined} onClick={complete}>
            {w.busy ? "Confirm in your wallet…" : "Collect egg"}
          </Button>
        </>
      ) : (
        <div className="space-y-3"><Loading>
          Preparing your egg…
        </Loading></div>
      )}
      {data && data[8] >= 2 && data[8] <= 3 && <TestRandomness keeper="bertha" requestId={data[6]} fulfilled={request.data?.fulfilled || data[8] === 3} refreshed={() => request.refetch()} />}
      <ErrorMessage message={w.error} />
    </div>
  );
}
