"use client";
import { chainConnectionOptions } from "@/lib/thirdweb/chain-connection";
import { walletConnectionAvailable } from "@/lib/thirdweb/preview";

import { nurseryError } from "@/lib/nursery/contracts";
import { useState } from "react";
import { useConnectModal } from "thirdweb/react";
import { Button } from "@workspace/ui/components/button";
import { AlertCircle, WalletCards, LoaderCircle } from "lucide-react";
import { formatUnits } from "viem";
export const evoAmount = (value: bigint) => formatUnits(value, 18);
export const avaxAmount = (value: bigint) => {
  const text = formatUnits(value, 18);
  const [whole, fraction = ""] = text.split(".");
  return `${whole}.${fraction.padEnd(8, "0").slice(0, 8)}${fraction.length > 8 ? "…" : ""}`;
};
export function ConnectNursery({
  connectedAddress,
}: {
  connectedAddress?: string;
}) {
  const { connect, isConnecting } = useConnectModal();
  const [error, setError] = useState<string | null>(null);
  const connectWallet = async () => {
    if (!walletConnectionAvailable) return;
    setError(null);
    try {
      await connect(chainConnectionOptions());
    } catch (e) {
      setError(nurseryError(e));
    }
  };
  return (
    <div className="rounded-xl border bg-card p-6 space-y-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
        <div>
          <p className="font-bold">
            {connectedAddress
              ? "Your Nursery wallet"
              : "Bring your Evos to the Nursery"}
          </p>
          <p className="text-sm text-muted-foreground">
            {connectedAddress
              ? `${connectedAddress.slice(0, 6)}…${connectedAddress.slice(-4)} · Avalanche C-Chain`
              : "Connect the wallet that owns your Evos on Avalanche."}
          </p>
        </div>
        <Button disabled={!walletConnectionAvailable || isConnecting} onClick={connectWallet}>
          <WalletCards className="size-4" />
          {isConnecting
            ? "Connecting…"
            : connectedAddress
              ? "Change wallet"
              : "Connect wallet"}
        </Button>
      </div>
      <ErrorMessage message={error} />
    </div>
  );
}
export function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
      {children}
    </div>
  );
}
export function ErrorMessage({ message }: { message?: string | null }) {
  return message ? (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
    >
      <AlertCircle className="size-4 shrink-0 mt-0.5" />
      {message}
    </p>
  ) : null;
}
export function Loading({
  children = "Loading your Evos…",
}: {
  children?: React.ReactNode;
}) {
  return (
    <p
      role="status"
      className="flex items-center gap-2 p-4 text-muted-foreground"
    >
      <LoaderCircle className="size-4 animate-spin" />
      {children}
    </p>
  );
}
export function VrfPrice({
  quote,
  maximum,
}: {
  quote: bigint;
  maximum: bigint;
}) {
  return (
    <div className="space-y-1 text-sm">
      <p>
        Randomness surcharge: <strong>{avaxAmount(quote)} AVAX</strong>
      </p>
      <p className="text-muted-foreground">
        Maximum authorised: {avaxAmount(maximum)} AVAX, including a 10% quote
        buffer. Unused AVAX stays yours and can be reclaimed below. Network gas
        is extra.
      </p>
      {quote === 0n && (
        <p className="text-primary">
          The Nursery is covering randomness fees for this request.
        </p>
      )}
    </div>
  );
}
