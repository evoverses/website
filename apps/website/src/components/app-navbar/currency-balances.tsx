"use client";

import { useProMode } from "@/components/providers/pro-mode-provider";
import { useChainWallet } from "@/hooks/use-chain-wallet";
import { useEvoBalance } from "@/hooks/use-evo-balance";
import { formatEvoBalance } from "@/lib/store/balance";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";

export function CurrencyBalances({ playerId, evoros }: { playerId?: string; evoros?: number }) {
  const { proMode } = useProMode();
  const { account } = useChainWallet();
  const evo = useEvoBalance(account?.address, proMode);
  const queries = useQueryClient();
  const key = ["player-menu-balance", playerId];
  const balance = useQuery<{ evoros: number } | null>({
    queryKey: key, enabled: Boolean(playerId), meta: { private: true },
    initialData: playerId && evoros !== undefined ? { evoros } : undefined,
    queryFn: async () => {
      const response = await fetch("/api/player/me", { credentials: "same-origin", cache: "no-store" });
      if (response.status === 401) return null;
      if (!response.ok) throw new Error("Balance unavailable");
      const value = await response.json();
      if (value.player?.id !== playerId || !Number.isSafeInteger(value.balance?.evoros) || value.balance.evoros < 0) throw new Error("Unexpected balance");
      return { evoros: value.balance.evoros };
    },
    staleTime: 15_000, refetchInterval: playerId ? 30_000 : false, retry: 1,
  });
  // Router refresh after Checkout updates the navbar's verified server balance too.
  useEffect(() => {
    if (playerId && evoros !== undefined) queries.setQueryData(["player-menu-balance", playerId], { evoros });
  }, [playerId, evoros, queries]);
  const evorosText = !playerId || balance.data === null ? "—" : balance.isError ? "Unavailable" : balance.data?.evoros.toLocaleString("en-US") ?? "…";
  const evoText = !account ? "—" : evo.isError ? "Unavailable" : evo.data === undefined ? "…" : formatEvoBalance(evo.data);
  const badge = "flex items-center gap-1.5 rounded-md border bg-muted/30 px-2 py-1.5 text-xs sm:text-sm tabular-nums min-w-0";
  return <div className="flex items-center gap-1 sm:gap-2" aria-label="Currency balances">
    <Link href={playerId && balance.data !== null ? "/store" : "/signin"} className={badge} data-testid="navbar-evoros" title={playerId && balance.data !== null ? "Your Evoros game balance" : "Sign in to see your Evoros"} aria-label={`Evoros balance: ${evorosText}`}>
      <Image src="/store/evoros/currency_balance.png" width={24} height={24} className="size-5 sm:size-6 shrink-0" alt="" />
      <span aria-live="polite">{evorosText}</span><span className="hidden 2xl:inline">Evoros</span>
    </Link>
    {proMode && <span className={badge} data-testid="navbar-evo" title={account ? "Connected wallet EVO balance on Avalanche C-Chain" : "Connect a wallet to see your EVO"} aria-label={`EVO balance: ${evoText}`}>
      <Image src="/EVO.png" width={24} height={24} className="size-5 sm:size-6 shrink-0" alt="" />
      <span aria-live="polite">{evoText}</span><span className="hidden 2xl:inline">EVO</span>
    </span>}
  </div>;
}
