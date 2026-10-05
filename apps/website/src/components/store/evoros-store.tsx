"use client";

import { evorosBundles } from "@/data/evoros-bundles";
import { evoContractAddress } from "@/data/addresses";
import {
  appMetadata,
  chain,
  chainWallets,
  client,
} from "@/lib/thirdweb/config";
import { formatEvoBalance } from "@/lib/store/balance";
import { readEvoBalance } from "@/lib/store/token";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Check, Coins, CreditCard, Gamepad2, WalletCards } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { darkTheme, useActiveAccount, useConnectModal } from "thirdweb/react";
import type { Address } from "viem";

const amount = (value: number) => value.toLocaleString("en-US");

function StoreWallet() {
  const account = useActiveAccount();
  const { connect, isConnecting } = useConnectModal();
  const [error, setError] = useState<string | null>(null);
  const balance = useQuery({
    queryKey: [
      "evoros-evo-balance",
      chain.id,
      evoContractAddress,
      account?.address.toLowerCase(),
    ],
    enabled: Boolean(account),
    queryFn: () => readEvoBalance(account!.address as Address),
    staleTime: 15_000,
    retry: 1,
    refetchOnWindowFocus: true,
  });
  async function connectWallet() {
    setError(null);
    try {
      await connect({
        client,
        chain,
        chains: [chain],
        wallets: chainWallets,
        appMetadata,
        theme: darkTheme({ colors: { modalBg: "var(--background)" } }),
        showThirdwebBranding: false,
        size: "compact",
        titleIcon: "/icon.png",
        privacyPolicyUrl: "/privacy",
        termsOfServiceUrl: "/terms",
      });
    } catch {
      setError("Could not connect that wallet. Please try again.");
    }
  }
  return (
    <div
      className="rounded-xl border bg-muted/30 p-4 space-y-3"
      data-testid="store-wallet"
    >
      <div className="flex items-center gap-2 font-bold text-sm">
        <WalletCards className="size-4" aria-hidden="true" />
        Your EVO wallet
      </div>
      {account ? (
        <>
          <p
            className="text-xs text-muted-foreground break-all"
            title={account.address}
          >
            {account.address.slice(0, 6) + "…" + account.address.slice(-4)}
          </p>
          <div aria-live="polite">
            <p className="text-xs text-muted-foreground mb-1">
              EVO balance · Avalanche C-Chain
            </p>
            {balance.isError ? (
              <div className="space-y-2">
                <p role="alert" className="text-sm leading-relaxed">
                  We couldn’t load your EVO balance.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void balance.refetch()}
                  disabled={balance.isFetching}
                >
                  Retry balance
                </Button>
              </div>
            ) : (
              <p className="font-bold break-words">
                {balance.data === undefined
                  ? "Loading balance…"
                  : formatEvoBalance(balance.data) + " EVO"}
              </p>
            )}
          </div>
        </>
      ) : (
        <p className="text-sm leading-relaxed text-muted-foreground">
          Connect the wallet you keep your EVO in.
        </p>
      )}
      <Button
        variant="outline"
        className="w-full"
        disabled={isConnecting}
        onClick={() => void connectWallet()}
      >
        {isConnecting
          ? "Connecting…"
          : account
            ? "Change wallet"
            : "Connect wallet"}
      </Button>
      {error && (
        <p role="alert" className="text-sm leading-relaxed text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export default function EvorosStore() {
  const [selectedId, setSelectedId] = useState<string>(evorosBundles[0].id);
  const [payment, setPayment] = useState<"evo" | "card">("evo");
  const selected = evorosBundles.find((bundle) => bundle.id === selectedId)!;
  return (
    <main className="page mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="relative overflow-hidden rounded-2xl border bg-linear-to-br from-primary/10 via-card to-cyan-400/10 p-6 sm:p-9 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8">
          <div className="flex items-center justify-center size-20 rounded-2xl border border-amber-400/30 bg-amber-300/10 shrink-0">
            <Image
              src="/store/evoros/currency_balance.png"
              alt=""
              width={64}
              height={64}
              className="size-14"
              priority
            />
          </div>
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              EvoVerses store · Beta preview
            </p>
            <h1 className="text-4xl sm:text-5xl font-black leading-tight">
              Stock up on Evoros
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              Top up your Evoros with EVO or a card payment. Potions, revives
              and the supplies for your next battle—all from one game balance.
            </p>
          </div>
        </div>
      </header>
      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_20rem] items-start">
        <section aria-labelledby="bundle-heading">
          <div className="mb-5 space-y-2">
            <h2 id="bundle-heading" className="text-2xl font-extrabold">
              Choose your bundle
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Six ways to top up. Choose a bundle to see your purchase summary.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {evorosBundles.map((bundle) => {
              const chosen = selected.id === bundle.id;
              return (
                <Card
                  key={bundle.id}
                  data-testid={bundle.id}
                  className={cn(
                    "relative gap-3 py-4 transition-colors overflow-hidden",
                    chosen
                      ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                      : "hover:border-primary/50",
                  )}
                >
                  <div className="absolute top-3 right-3 h-6">
                    {chosen && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-xs font-bold text-primary-foreground">
                        <Check className="size-3" aria-hidden="true" />
                        Selected
                      </span>
                    )}
                  </div>
                  <div className="flex justify-center pt-4 px-3">
                    <Image
                      src={bundle.image}
                      alt=""
                      width={512}
                      height={512}
                      sizes="(max-width: 639px) 240px, 200px"
                      className="w-full max-w-52 aspect-square object-contain"
                      priority={bundle.id === "bundle_pouch"}
                    />
                  </div>
                  <CardHeader className="gap-2 px-4">
                    <CardTitle>
                      <h3 className="text-xl font-extrabold">
                        {amount(bundle.amount)} Evoros
                      </h3>
                    </CardTitle>
                    <p className="text-sm font-bold">{bundle.name}</p>
                    <p className="text-xs leading-relaxed text-muted-foreground min-h-9">
                      {bundle.description}
                    </p>
                  </CardHeader>
                  <CardFooter className="px-4 mt-auto flex-col items-stretch gap-3">
                    <p className="text-sm text-muted-foreground">
                      {payment === "evo"
                        ? "EVO price to be confirmed"
                        : "Card price to be confirmed"}
                    </p>
                    <Button
                      variant={chosen ? "default" : "outline"}
                      className="w-full font-bold"
                      aria-pressed={chosen}
                      aria-label={
                        "Select " +
                        amount(bundle.amount) +
                        " Evoros · " +
                        bundle.name
                      }
                      onClick={() => setSelectedId(bundle.id)}
                    >
                      {chosen ? (
                        <>
                          <Check className="size-4" aria-hidden="true" />
                          Selected
                        </>
                      ) : (
                        "Select bundle"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
          <div className="mt-6 rounded-xl border bg-card p-5 space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <Gamepad2 className="size-4 text-primary" aria-hidden="true" />
              Made for the in-game shop
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Evoros are your in-game spending balance. When purchases open,
              your bundle will go to your linked game account, ready to use in
              the game.
            </p>
          </div>
        </section>
        <aside className="lg:sticky lg:top-24" aria-label="Purchase summary">
          <Card className="gap-5">
            <CardHeader>
              <CardTitle className="text-xl font-extrabold">
                Your bundle
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div
                aria-live="polite"
                aria-atomic="true"
                data-testid="purchase-summary"
              >
                <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-3 mb-4">
                  <Image
                    src={selected.image}
                    alt=""
                    width={80}
                    height={80}
                    className="size-18 object-contain shrink-0"
                  />
                  <div className="space-y-2 min-w-0">
                    <p className="text-xs text-muted-foreground">
                      {selected.name}
                    </p>
                    <p className="text-xl font-extrabold">
                      {amount(selected.amount)} Evoros
                    </p>
                  </div>
                </div>
                <dl className="text-sm space-y-4">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">You receive</dt>
                    <dd className="font-bold">
                      {amount(selected.amount)} Evoros
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">You pay</dt>
                    <dd className="font-bold">Price pending</dd>
                  </div>
                  {payment === "evo" && (
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">EVO discount</dt>
                      <dd>To be confirmed</dd>
                    </div>
                  )}
                </dl>
              </div>
              <div className="space-y-3">
                <p className="font-bold text-sm">How would you like to pay?</p>
                <div
                  className="grid grid-cols-2 gap-2"
                  role="group"
                  aria-label="Payment method"
                >
                  <Button
                    variant={payment === "evo" ? "default" : "outline"}
                    aria-pressed={payment === "evo"}
                    onClick={() => setPayment("evo")}
                  >
                    <Coins className="size-4" aria-hidden="true" />
                    EVO
                  </Button>
                  <Button
                    variant={payment === "card" ? "default" : "outline"}
                    aria-pressed={payment === "card"}
                    onClick={() => setPayment("card")}
                  >
                    <CreditCard className="size-4" aria-hidden="true" />
                    Card
                  </Button>
                </div>
              </div>
              {payment === "evo" ? (
                <StoreWallet />
              ) : (
                <div
                  className="rounded-xl border bg-muted/30 p-4 space-y-2"
                  data-testid="stripe-payment-info"
                >
                  <p className="font-bold text-sm">Card payments with Stripe</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    When purchases open, you’ll pay on Stripe’s secure checkout
                    page. No crypto wallet is needed for card payments.
                  </p>
                </div>
              )}
              <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
                <p className="font-bold text-sm">Your game account</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Game account linking is coming next. Your Evoros balance will
                  appear here once it is connected.
                </p>
              </div>
              <div className="space-y-3">
                <Button
                  className="w-full font-bold"
                  disabled
                  aria-describedby="purchase-disabled-reason"
                  data-testid="purchase-button"
                >
                  {payment === "evo" ? (
                    <Coins className="size-4" aria-hidden="true" />
                  ) : (
                    <CreditCard className="size-4" aria-hidden="true" />
                  )}
                  {payment === "evo"
                    ? "Buy with EVO · Coming soon"
                    : "Pay by card · Coming soon"}
                </Button>
                <p
                  id="purchase-disabled-reason"
                  className="text-xs text-muted-foreground leading-relaxed"
                >
                  You can browse and select bundles in this beta preview.
                  Purchases are not open yet, so no payment is taken.
                </p>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}
