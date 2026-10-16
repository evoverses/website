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
import { createThirdwebClient, prepareTransaction, sendTransaction } from "thirdweb";
import { avalanche } from "thirdweb/chains";
import { formatUnits } from "viem";
import { clientId } from "@/lib/thirdweb/env.client";
import { evoOrderSchema, validateEvoOrder, type EvoOrder } from "@/lib/store/evo-checkout";
const paymentClient = createThirdwebClient({ clientId });

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
  playerAccount?: { id: string; displayName: string; evoros: number };
  sandboxCheckoutReady?: boolean;
} = {}) {
  const [selectedId, setSelectedId] = useState<string>(evorosBundles[0].id);
  const router = useRouter();
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const requestIds = useRef<Record<string, string>>({});
  const inFlight = useRef(false);
  const [pendingEvo, setPendingEvo] = useState<{ order: EvoOrder; transactionHash?: string } | null>(null);
  const [recoveryHash, setRecoveryHash] = useState("");
  const recoveryKey = playerAccount ? "evoros-payment:v1:" + playerAccount.id : null;
  useEffect(() => {
    setPendingEvo(null); setRecoveryHash("");
    if (!recoveryKey) return;
    try {
      const value = JSON.parse(localStorage.getItem(recoveryKey) ?? "null");
      if (!value) return;
      const order = evoOrderSchema.parse(value.order);
      const transactionHash = /^0x[a-fA-F0-9]{64}$/.test(value.transactionHash ?? "") ? value.transactionHash : undefined;
      setPendingEvo({ order, transactionHash }); setRecoveryHash(transactionHash ?? ""); setSelectedId(order.bundleId);
    } catch { /* A malformed browser recovery record cannot authorize a payment. */ }
  }, [recoveryKey]);
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

  const { account: connectedAccount, wallet: connectedWallet } = useChainWallet();
  const { proMode } = useProMode();
  const account = proMode ? connectedAccount : undefined;
  async function evoRpc(operation: "reserve" | "verify", body: object) {
    const response = await fetch("/api/store/evo/" + operation, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", cache: "no-store", body: JSON.stringify(body), signal: AbortSignal.timeout(35000) });
    const value = await response.json();
    if (!response.ok) throw Error(value.error ?? "EVO payment is not confirmed yet. Keep its transaction hash and check again.");
    return value;
  }
  async function buyWithEvo() {
    if (!evorosPurchasesEnabled || inFlight.current || !playerAccount || !recoveryKey) return;
    inFlight.current = true; setPurchasing(true); setPurchaseError(null);
    let submitted = pendingEvo;
    try {
      if (!submitted) {
        if (!account || !connectedWallet) throw Error("Connect and link your EVO wallet through your profile first.");
        const bundle = evorosBundles.find(b => b.id === selectedId)!;
        const requestKey = "evo:" + selectedId + ":" + account.address.toLowerCase();
        requestIds.current[requestKey] ??= crypto.randomUUID();
        const raw = await evoRpc("reserve", { requestId: requestIds.current[requestKey], bundleId: selectedId, address: account.address });
        const order = validateEvoOrder(raw, account.address, selectedId, bundle.amount);
        await connectedWallet.switchChain(avalanche);
        if (connectedWallet.getAccount()?.address.toLowerCase() !== account.address.toLowerCase()) throw Error("Your wallet changed. Select your EVO wallet and try again.");
        // Save intent before opening the wallet. An uncertain submission must never trigger a second transfer.
        submitted = { order }; localStorage.setItem(recoveryKey, JSON.stringify(submitted)); setPendingEvo(submitted);
        setConfirmation("Confirm " + formatUnits(BigInt(order.units), 18) + " EVO in your wallet. AVAX network gas is additional.");
        const sent = await sendTransaction({ account, transaction: prepareTransaction({ client: paymentClient, chain: avalanche, to: order.token, data: order.data as `0x${string}`, value: 0n }) });
        submitted = { order, transactionHash: sent.transactionHash }; setPendingEvo(submitted); setRecoveryHash(sent.transactionHash);
        try { localStorage.setItem(recoveryKey, JSON.stringify(submitted)); } catch { /* The hash remains visible for manual recovery. */ }
      }
      const transactionHash = (recoveryHash || submitted.transactionHash || "").trim();
      if (!/^0x[a-fA-F0-9]{64}$/.test(transactionHash)) throw Error("If your wallet submitted this payment, paste its transaction hash below to check it. Do not send a second payment.");
      submitted = { ...submitted, transactionHash }; setPendingEvo(submitted);
      try { localStorage.setItem(recoveryKey, JSON.stringify(submitted)); } catch { /* Verification still records the hash durably on the account service. */ }
      const result = await evoRpc("verify", { orderId: submitted.order.orderId, transactionHash });
      if (result.status !== "credited" || result.orderId !== submitted.order.orderId) throw Error("Your payment is confirming. Check again shortly.");
      try { localStorage.removeItem(recoveryKey); } catch { /* A stale recovery entry only rechecks an already credited order. */ }
      setPendingEvo(null); setRecoveryHash(""); delete requestIds.current["evo:" + submitted.order.bundleId + ":" + submitted.order.payer];
      setConfirmation(amount(result.evoros) + " Evoros added to your game account."); router.refresh();
    } catch (error) {
      const rejected = error as { code?: number; cause?: { code?: number }; name?: string };
      if (rejected.code === 4001 || rejected.cause?.code === 4001 || rejected.name === "UserRejectedRequestError") {
        try { localStorage.removeItem(recoveryKey); } catch { /* No payment was accepted by the wallet. */ }
        setPendingEvo(null); setRecoveryHash("");
      }
      if (!submitted && account) delete requestIds.current["evo:" + selectedId + ":" + account.address.toLowerCase()];
      setPurchaseError(error instanceof Error ? error.message : "EVO payment is not confirmed yet. Keep your transaction hash.");
    } finally { inFlight.current = false; setPurchasing(false); }
  }
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
              Buy Evoros for potions, revives and other supplies in the game.
              Pay by card, or use EVO with a connected and linked wallet.
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
              Evoros are your in-game spending balance. Your purchased bundle
              goes to your signed-in game account, ready to use in the game.
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
                        : "Card checkout is temporarily unavailable. Please try again soon."}
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
                    (payment === "card" ? !sandboxCheckoutReady : !pendingEvo && (!account || !rate.quote)) ||
                    !playerAccount ||
                    purchasing
                  }
                  onClick={() => void (payment === "evo" ? buyWithEvo() : buyByCard())}
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
                    ? purchasing ? "Checking EVO payment…" : pendingEvo ? "Check EVO payment" : "Buy with EVO"
                    : purchasing
                      ? "Opening Stripe…"
                      : sandboxCheckoutReady
                        ? "Pay by card · Test checkout"
                        : "Pay by card · Coming soon"}
                </Button>
                {payment === "evo" && pendingEvo && <label className="block space-y-2 text-xs text-muted-foreground">
                  <span>EVO payment transaction hash</span>
                  <input className="block w-full min-w-0 rounded border bg-background p-2 font-mono" value={recoveryHash} onChange={event => setRecoveryHash(event.target.value)} placeholder="0x…" />
                  <span>Check this payment to confirm your Evoros. Verification will not send another payment.</span>
                </label>}
                <p
                  id="purchase-disabled-reason"
                  className="text-xs text-muted-foreground leading-relaxed"
                >
                  {!evorosPurchasesEnabled
                    ? betaPurchaseMessage
                    : !playerAccount
                    ? "Sign in with Epic before buying Evoros."
                    : payment === "evo"
                      ? "EVO payments use Avalanche C-Chain. Connect and link your wallet on your profile. Evoros are added after payment is confirmed."
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
