"use client";
import { usesChainlinkRandomness } from "@/lib/nursery/network";
import { nurseryChain, nurseryNetworkMessage, nurseryTransactionsEnabled } from "@/lib/nursery/network";
import { defineChain } from "thirdweb";
import { chainConnectionOptions } from "@/lib/thirdweb/chain-connection";
import { walletConnectionAvailable } from "@/lib/thirdweb/preview";

import { nurseryError } from "@/lib/nursery/contracts";
import { useState } from "react";
import { useConnectModal } from "thirdweb/react";
import { Button } from "@workspace/ui/components/button";
import { AlertCircle, WalletCards, LoaderCircle } from "lucide-react";
import { formatUnits } from "viem";
export const evoAmount = (value: bigint) => {
  const [whole, fraction] = formatUnits(value, 18).split(".");
  return whole!.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (fraction ? `.${fraction}` : "");
};
export const avaxAmount = (value: bigint) => formatUnits(value, 18);
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
      const chain = defineChain(nurseryChain.id);
      await connect({ ...chainConnectionOptions(), chain, chains: [chain] });
    } catch (e) {
      setError(nurseryError(e));
    }
  };
  return (
    <div className="rounded-xl border bg-card p-6 space-y-3">
      <p className="font-semibold text-primary">{nurseryNetworkMessage}</p>
      {nurseryChain.id === 43114 && !nurseryTransactionsEnabled && (
        <p role="status" className="text-sm text-muted-foreground">Mainnet testing is being prepared. Nursery actions are currently unavailable.</p>
      )}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
        <div>
          <p className="font-bold">
            {connectedAddress
              ? "Your wallet"
              : "Connect your wallet"}
          </p>
          <p className="text-sm text-muted-foreground">
            {connectedAddress
              ? `${connectedAddress.slice(0, 6)}…${connectedAddress.slice(-4)}`
              : "Choose the wallet that holds your Evos."}
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
  const smallFee = maximum > 0n && maximum < 10n ** 12n;
  return (
    <div className="space-y-2 text-sm">
      <p className="flex justify-between items-start gap-4">
        <span>AVAX fee</span>
        <strong className="text-right tabular-nums">{smallFee ? "< 0.000001" : avaxAmount(maximum)} AVAX <span className="font-normal text-xs text-muted-foreground">max</span></strong>
      </p>
      <p className="text-xs text-muted-foreground">Network fees are shown in your wallet.</p>
      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer w-fit">Fee details</summary>
        <dl className="mt-2 space-y-1 break-words">
          <div><dt className="inline">Current fee: </dt><dd className="inline">{avaxAmount(quote)} AVAX</dd></div>
          <div><dt className="inline">Maximum payment: </dt><dd className="inline">{avaxAmount(maximum)} AVAX</dd></div>
        </dl>
        <p className="mt-2">The maximum includes a 10% buffer. Any unused AVAX can be reclaimed below.</p>
        {quote === 0n && !usesChainlinkRandomness && <p className="mt-2">No preparation fee. Network fees still apply.</p>}
      </details>
    </div>
  );
}
