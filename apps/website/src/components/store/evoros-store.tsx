"use client";

import { evorosPurchasesEnabled, betaPurchaseMessage } from "@/lib/beta/release-policy";
import { useProMode } from "@/components/providers/pro-mode-provider";
import { walletConnectionAvailable } from "@/lib/thirdweb/preview";
import { evorosBundles } from "@/data/evoros-bundles";
import { formatEvoBalance } from "@/lib/store/balance";
import { cn } from "@/lib/utils";
import { useEvoBalance } from "@/hooks/use-evo-balance";
import { useChainWallet } from "@/hooks/use-chain-wallet";
import { chainConnectionOptions } from "@/lib/thirdweb/chain-connection";
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
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useEvoQuote } from "./use-evo-quote";
import {
  cashCents,
  usd,
  discountedEvoUnits,
  formatEvoEstimate,
} from "@/lib/store/pricing";
import { useConnectModal } from "thirdweb/react";

const amount = (value: number) => value.toLocaleString("en-US");

function StoreWallet({ account }: { account?: { address: string } }) {
  const { connect, isConnecting } = useConnectModal();
  const [error, setError] = useState<string | null>(null);
  const balance = useEvoBalance(account?.address);
  async function connectWallet() {
    if (!walletConnectionAvailable) return;
    setError(null);
    try {
      await connect(chainConnectionOptions());
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
        disabled={!walletConnectionAvailable || isConnecting}
        onClick={() => void connectWallet()}
      >
        {isConnecting
          ? "Connecting…"
          : account
            ? "Change wallet"
            : "Connect wallet"}
      </Button>
      {account && (
        <a
          className="block text-sm underline"
          href="https://lfj.gg/avalanche/trade/0x42006ab57701251b580bdfc24778c43c9ff589a1"
          target="_blank"
          rel="noreferrer"
        >
          View EVO on LFJ
        </a>
      )}
      {error && (
        <p role="alert" className="text-sm leading-relaxed text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export default function EvorosStore({
  playerAccount,
  sandboxCheckoutReady = false,
}: {
  playerAccount?: { displayName: string; evoros: number };
  sandboxCheckoutReady?: boolean;
} = {}) {
  const [selectedId, setSelectedId] = useState<string>(evorosBundles[0].id);
  const router = useRouter();
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const requestIds = useRef<Record<string, string>>({});
  const inFlight = useRef(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "cancelled") {
      setConfirmation("Checkout cancelled. You can try again.");
      return;
    }
    const orderId = params.get("order") || "";
    if (
      params.get("checkout") !== "returned" ||
      !/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(orderId)
    )
      return;
    let cancelled = false,
      timer: ReturnType<typeof setTimeout> | undefined,
      attempts = 0;
    setConfirmation("Checking your payment confirmation…");
    const poll = async () => {
      try {
        const response = await fetch(
          "/api/store/stripe/order?orderId=" + encodeURIComponent(orderId),
          { cache: "no-store", credentials: "same-origin" },
        );
        if (!response.ok)
          throw new Error(
            response.status === 401
              ? "Sign in again to check your purchase."
              : "Payment confirmation is temporarily unavailable. Refresh to check again.",
          );
        const result = await response.json();
        if (cancelled) return;
        if (result.status === "credited") {
          setConfirmation(
            `${amount(result.evoros)} Evoros added to your game account.`,
          );
          router.refresh();
          return;
        }
        if (++attempts < 12) timer = setTimeout(() => void poll(), 2000);
        else
          setConfirmation(
            "Still waiting for payment confirmation. Refresh to check again.",
          );
      } catch (error) {
        if (!cancelled)
          setConfirmation(
            error instanceof Error
              ? error.message
              : "Refresh to check your payment confirmation.",
          );
      }
    };
    void poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [router]);
  async function buyByCard() {
    if (!evorosPurchasesEnabled || inFlight.current || !playerAccount || !sandboxCheckoutReady) return;
    inFlight.current = true;
    setPurchasing(true);
    setPurchaseError(null);
    try {
      requestIds.current[selectedId] ??= crypto.randomUUID();
      const response = await fetch("/api/store/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          bundleId: selectedId,
          requestId: requestIds.current[selectedId],
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Checkout is temporarily unavailable.");
      const url = new URL(result.url);
      if (
        url.protocol !== "https:" ||
        url.hostname !== "checkout.stripe.com" ||
        url.username ||
        url.password
      )
        throw new Error("Unexpected checkout address.");
      window.location.assign(url.href);
    } catch (error) {
      setPurchaseError(
        error instanceof Error
          ? error.message
          : "Checkout is temporarily unavailable.",
      );
    } finally {
      inFlight.current = false;
      setPurchasing(false);
    }
  }

  const { account: connectedAccount } = useChainWallet();
  const { proMode } = useProMode();
  const account = proMode ? connectedAccount : undefined;
  const hasWallet = Boolean(account);
  const [requestedPayment, setPayment] = useState<"evo" | "card">("card");
  const payment = account ? requestedPayment : "card";
  useEffect(() => {
    if (!hasWallet) setPayment("card");
  }, [hasWallet]);
  const selected = evorosBundles.find((bundle) => bundle.id === selectedId)!;
  const rate = useEvoQuote(Boolean(account));
  const priceText = (evoros: number) =>
    payment === "card"
      ? usd(cashCents(evoros))
      : rate.quote
        ? "≈ " +
          formatEvoEstimate(discountedEvoUnits(evoros, rate.quote.priceUsd)) +
          " EVO"
        : rate.loading
          ? "Loading EVO price…"
          : rate.expired
            ? "EVO quote expired"
            : "EVO price unavailable";

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
              Browse Evoros bundles for the in-game shop. Purchases are paused
              during beta; approved testers receive 5,000 Evoros to try potions,
              revives and other supplies.
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
              Test pricing: US$0.01 per Evoro.
              {account && " Pay with EVO for 90% off the card price."}
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
                      {priceText(bundle.amount)}
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
                    <dd
                      className="font-bold text-right"
                      data-testid="selected-price"
                    >
                      {priceText(selected.amount)}
                    </dd>
                  </div>
                  {payment === "evo" && (
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">EVO discount</dt>
                      <dd>90% off</dd>
                    </div>
                  )}
                </dl>
              </div>
              {proMode && <div className="space-y-3">
                <p className="font-bold text-sm">How would you like to pay?</p>
                <div
                  className={cn(
                    "grid gap-2",
                    "grid-cols-2",
                  )}
                  role="group"
                  aria-label="Payment method"
                >
                  <Button
                    variant={payment === "card" ? "default" : "outline"}
                    aria-pressed={payment === "card"}
                    onClick={() => setPayment("card")}
                  >
                    <CreditCard className="size-4" aria-hidden="true" />
                    FIAT
                  </Button>
                  <Button
                      disabled={!account}
                      title={account ? undefined : "Connect a wallet to see EVO prices"}
                      variant={payment === "evo" ? "default" : "outline"}
                      aria-pressed={payment === "evo"}
                      onClick={() => setPayment("evo")}
                    >
                      <Coins className="size-4" aria-hidden="true" />
                      EVO
                    </Button>
                </div>
                {!account && <p className="text-xs text-muted-foreground">Connect a wallet to see EVO prices.</p>}
              </div>}
              {payment === "evo" && (
                <div
                  className="rounded-xl border bg-muted/30 p-4 space-y-3 text-sm break-words"
                  data-testid="evo-quote-info"
                  aria-live="polite"
                >
                  <p className="font-bold">How your EVO price is calculated</p>
                  <p>
                    Your {usd(cashCents(selected.amount))} bundle costs just{" "}
                    {usd(cashCents(selected.amount) / 10)} worth of EVO after
                    90% off.
                  </p>
                  {rate.quote ? (
                    <>
                      <p>
                        Divide {usd(cashCents(selected.amount) / 10)} by{" "}
                        {"US$" + rate.quote.priceUsd} per EVO to get the EVO
                        amount above.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Rate fetched at{" "}
                        {new Date(rate.quote.fetchedAt).toLocaleTimeString()}{" "}
                        from{" "}
                        <a
                          className="underline"
                          href={
                            rate.quote.source === "DexScreener"
                              ? "https://dexscreener.com/avalanche/" + rate.quote.poolAddress
                              : "https://www.geckoterminal.com/avax/pools/" + rate.quote.poolAddress
                          }
                          target="_blank"
                          rel="noreferrer"
                        >
                          {rate.quote.source}
                        </a>
                        . This estimate lasts five minutes. AVAX network gas is
                        extra.
                      </p>
                    </>
                  ) : (
                    <p className="text-muted-foreground">
                      {rate.loading
                        ? "Fetching the market rate…"
                        : rate.expired
                          ? "This quote has expired. Refresh to get a new rate."
                          : "We couldn’t fetch the market rate. No EVO amount is shown until a valid rate is available."}
                    </p>
                  )}
                  {rate.error && rate.quote && (
                    <p className="text-muted-foreground">
                      Refresh failed. Your previous estimate remains valid until it expires.
                    </p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={rate.loading}
                    onClick={() => void rate.refresh()}
                  >
                    {rate.loading ? "Refreshing EVO quote…" : "Refresh EVO quote"}
                  </Button>
                </div>
              )}
              {payment === "evo" ? (
                <StoreWallet account={account} />
              ) : (
                <div
                  className="rounded-xl border bg-muted/30 p-4 space-y-2"
                  data-testid="stripe-payment-info"
                >
                  <p className="font-bold text-sm">Card payments with Stripe</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {!evorosPurchasesEnabled
                      ? "Card payments are on standby. Checkout is disabled during beta."
                      : sandboxCheckoutReady
                        ? "Sandbox checkout opens Stripe’s secure payment page. Payments are simulated; no real money is charged."
                        : "Card checkout is being prepared for local testing."}
                  </p>
                </div>
              )}
              <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
                <p className="font-bold text-sm">Your game account</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {playerAccount
                    ? `Signed in as ${playerAccount.displayName}. Your balance is ${amount(playerAccount.evoros)} Evoros.`
                    : "Sign in with Epic to use the same game account here and in the game. You must be signed in before buying Evoros."}
                </p>
              </div>
              <div className="space-y-3">
                {confirmation && (
                  <p
                    role="status"
                    className="rounded-xl border bg-primary/5 p-3 text-sm"
                  >
                    {confirmation}
                  </p>
                )}
                {purchaseError && (
                  <p role="alert" className="text-sm text-destructive">
                    {purchaseError}
                  </p>
                )}
                <Button
                  className="w-full font-bold"
                  disabled={
                    !evorosPurchasesEnabled ||
                    payment === "evo" ||
                    !sandboxCheckoutReady ||
                    !playerAccount ||
                    purchasing
                  }
                  onClick={() => void buyByCard()}
                  aria-describedby="purchase-disabled-reason"
                  data-testid="purchase-button"
                >
                  {payment === "evo" ? (
                    <Coins className="size-4" aria-hidden="true" />
                  ) : (
                    <CreditCard className="size-4" aria-hidden="true" />
                  )}
                  {!evorosPurchasesEnabled
                    ? "Purchases paused for beta"
                    : payment === "evo"
                    ? "Buy with EVO · Coming soon"
                    : purchasing
                      ? "Opening Stripe…"
                      : sandboxCheckoutReady
                        ? "Pay by card · Test checkout"
                        : "Pay by card · Coming soon"}
                </Button>
                <p
                  id="purchase-disabled-reason"
                  className="text-xs text-muted-foreground leading-relaxed"
                >
                  {!evorosPurchasesEnabled
                    ? betaPurchaseMessage
                    : !playerAccount
                    ? "Sign in with Epic before buying Evoros."
                    : payment === "evo"
                      ? "EVO purchases are coming soon."
                      : sandboxCheckoutReady
                        ? "Test prices: US$0.01 per Evoro. Purchased Evoros go to your signed-in game account."
                        : "Sandbox checkout is not configured yet."}
                </p>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}
