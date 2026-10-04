"use client";
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
  evoAmount,
} from "./shared";
import { ParentSelector } from "./parent-selector";
import { NativeCredits } from "./native-credits";

export function Breeder() {
  const w = useNurseryWallet();
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
  const breedUnavailable = !nurseryConfigured
    ? "Breeding is not live yet. The Breed button will be enabled when the Nursery opens."
    : !w.account
      ? "Connect your wallet to breed."
      : !first || !second
        ? "Choose both parents to breed."
        : !validPair
          ? "One of these Evos cannot breed right now. Check the messages on the parents above."
          : quote.isFetching
            ? "Checking the latest price before you can breed…"
            : quote.isError
              ? "Refresh the quote above before you can breed."
              : !priceMatches
                ? "Waiting for a verified price. If the breeding history changed, refresh your Evos."
                : w.busy
                  ? "Complete the current step in your wallet."
                  : undefined;
  const breed = () =>
    w.run(async () => {
      if (!w.account || !first || !second || !quote.data || !priceMatches)
        return;
      const account = w.account;
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
        approve: (cost) => approveEvo(account, berthaAddress!, cost, w.guard),
        quote: () => vrfQuote(berthaAddress!, berthaAbi),
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
      {!nurseryConfigured && (
        <Notice>
          Breeding is not live yet. You can choose your Evos and preview the
          price. No payments can be made here yet.
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
          <CardTitle>Breeding price</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-muted-foreground">
            You pay a fee for each parent. Add the two fees to get the EVO
            price of creating one egg. A higher generation or more previous
            breeds makes a parent more expensive.
          </p>
          {first && second ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                {[first, second].map((option, i) => {
                  const p = option.parent;
                  const count =
                    p.generation === 0n && p.totalBreeds > 4n
                      ? 4n
                      : p.totalBreeds;
                  return (
                    <div
                      key={p.tokenId}
                      className="rounded-lg bg-muted/40 p-4 space-y-1"
                    >
                      <p className="font-bold">
                        Parent {i + 1} · #{p.tokenId}
                      </p>
                      <ol className="list-decimal pl-5 space-y-2 text-sm">
                        <li>
                          <strong>Generation {String(p.generation)}</strong> sets
                          this parent’s starting price at{" "}
                          <strong>{evoAmount(500n * 10n ** 18n * 2n ** p.generation)} EVO</strong>.
                          <span className="block text-muted-foreground">
                            The starting price doubles each generation:
                            Gen 0 = 500 EVO, Gen 1 = 1,000 EVO, Gen 2 = 2,000 EVO.
                          </span>
                        </li>
                        <li>
                          <strong>
                            Already bred {String(p.totalBreeds)}{" "}
                            {p.totalBreeds === 1n ? "time" : "times"}:
                          </strong>{" "}
                          {p.generation === 0n && p.totalBreeds > 4n
                            ? "the price stays at 5 times the starting price, because Generation 0 has reached its price cap."
                            : p.totalBreeds === 0n
                              ? "this is their first breed, so you pay the starting price."
                              : `this will be breed number ${String(p.totalBreeds + 1n)}, so the cost is ${String(count + 1n)} times the starting price.`}
                          <span className="block text-muted-foreground">
                            First breed = starting price; second breed = twice
                            that price; third breed = three times that price.
                          </span>
                        </li>
                      </ol>
                      <p className="text-sm pt-3 break-words">
                        {evoAmount(500n * 10n ** 18n * 2n ** p.generation)} EVO ×{" "}
                        {String(count + 1n)} = <strong>{evoAmount(parentCost(p))} EVO</strong>
                      </p>
                      <p className="text-lg font-bold">
                        This parent costs {evoAmount(parentCost(p))} EVO
                      </p>
                      {p.generation === 0n && p.totalBreeds >= 4n && (
                        <p className="text-xs text-muted-foreground">
                          Generation 0’s fee stops increasing at 2,500 EVO per parent.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-xl font-black">
                Total:{" "}
                {evoAmount(
                  parentCost(first.parent) + parentCost(second.parent),
                )}{" "}
                EVO
              </p>
              <p className="text-sm">
                Parent 1 ({evoAmount(parentCost(first.parent))} EVO) + Parent 2
                ({evoAmount(parentCost(second.parent))} EVO) = the total above.
                This creates <strong>one egg</strong>.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                <li>
                  Breeding also requires an AVAX randomness-generation fee,
                  separate from the EVO total. You will see the amount before
                  you breed. Your wallet also charges a network fee.
                </li>
                <li>
                  Hatching requires another AVAX randomness-generation fee,
                  paid later when you request hatching. It is not an additional
                  EvoVerses hatching fee, and it is not included in the total above.
                </li>
              </ul>
            </>
          ) : (
            <p className="text-muted-foreground">
              Choose both parents to see their individual prices and the total.
            </p>
          )}
          {quote.isFetching && validPair && nurseryConfigured ? (
            <Loading>Checking the current price…</Loading>
          ) : validPair && quote.isError ? (
            <>
              <ErrorMessage message="The pair or price could not be verified. Your Evos may still be recovering or already breeding." />
              <Button
                variant="outline"
                onClick={() => {
                  void quote.refetch();
                  void parents.refetch();
                }}
              >
                Refresh quote
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
              Your Evos’ breeding history changed. Refresh them to see the
              latest calculation.
            </Notice>
          )}
          <ErrorMessage message={w.error} />
          <Button
            className="w-full sm:w-auto min-w-48 font-bold"
            size="lg"
            aria-describedby={breedUnavailable ? "breed-availability" : undefined}
            disabled={
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
            {w.busy ? "Confirm in your wallet…" : "Breed"}
          </Button>
          {breedUnavailable && (
            <p id="breed-availability" className="text-sm text-muted-foreground">
              {breedUnavailable}
            </p>
          )}
          {w.account && (
            <p className="text-xs text-muted-foreground">
              If needed, your wallet will first ask you to approve the exact EVO
              cost.
            </p>
          )}
        </CardContent>
      </Card>
      {w.account && history.values.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold">Your breeding requests</h2>
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
            Recover a breeding request
          </summary>
          <p className="text-sm text-muted-foreground mt-3">
            Use the transaction hash from your wallet if you bred on another
            device.
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
              disabled={w.busy || !/^0x[\da-fA-F]{64}$/.test(recoverHash)}
              type="submit"
            >
              Recover
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
  const rememberEgg = eggs.remember;
  useEffect(() => {
    if (completedEgg) rememberEgg(completedEgg);
  }, [completedEgg, rememberEgg]);
  const complete = () =>
    w.run(async () => {
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
            ? `Breeding request #${requestId}`
            : "Breeding transaction"}
        </p>
        <a
          className="text-xs text-primary"
          href={`https://snowtrace.io/tx/${hash}`}
          target="_blank"
          rel="noreferrer"
        >
          View transaction
        </a>
      </div>
      {receipt.isError || request.isError ? (
        <>
          <ErrorMessage message="Could not check your request. Your transaction is saved; retry before breeding again." />
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
        <p>The transaction reverted. No breeding payment was taken.</p>
      ) : !receipt.data ? (
        <Loading>Waiting for transaction confirmation…</Loading>
      ) : requestId === undefined ? (
        <ErrorMessage message="This transaction is not a breeding request from this wallet." />
      ) : data?.[8] === 3 ? (
        <p className="text-primary font-bold">
          Egg #{String(data[7])} is ready for the nursery.{" "}
          <Link className="underline" href={`/nursery/hermann?egg=${data[7]}`}>
            Visit Hermann
          </Link>
        </p>
      ) : request.data?.fulfilled ? (
        <>
          <p>
            Bertha’s egg is ready. Collect it to begin the three-day incubation.
          </p>
          <Button disabled={w.busy} onClick={complete}>
            {w.busy ? "Confirm in your wallet…" : "Collect egg"}
          </Button>
        </>
      ) : (
        <Loading>
          Waiting for randomness. Your parents are reserved and your EVO is held
          safely.
        </Loading>
      )}
      <ErrorMessage message={w.error} />
    </div>
  );
}
