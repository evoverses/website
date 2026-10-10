"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { quoteIsFresh, positiveDecimal } from "@/lib/store/pricing";
import type { EvoMarketQuote } from "@/lib/store/evo-price";
export function useEvoQuote(enabled: boolean) {
  const [quote, setQuote] = useState<EvoMarketQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [now, setNow] = useState(Date.now());
  const active = useRef<AbortController | null>(null);
  const refresh = useCallback(async () => {
    active.current?.abort();
    if (!enabled) {
      setQuote(null);
      setError(false);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    active.current = controller;
    setLoading(true);
    setError(false);
    // Keep the last verified price visible while its replacement is pending.
    try {
      const response = await fetch("/api/store/evo-quote", {
        cache: "no-store",
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15_000)]),
      });
      if (!response.ok) throw new Error("Quote unavailable.");
      const data: EvoMarketQuote = await response.json();
      positiveDecimal(data.priceUsd);
      if (!["GeckoTerminal", "DexScreener"].includes(data.source) || !quoteIsFresh(data.fetchedAt))
        throw new Error("Invalid quote.");
      if (!controller.signal.aborted) {
        setQuote(data);
        setNow(Date.now());
      }
    } catch {
      if (!controller.signal.aborted) setError(true);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [enabled]);
  useEffect(() => {
    void refresh();
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      active.current?.abort();
      clearInterval(timer);
    };
  }, [refresh]);
  return {
    quote: quote && quoteIsFresh(quote.fetchedAt, now) ? quote : null,
    expired: Boolean(quote && !quoteIsFresh(quote.fetchedAt, now)),
    loading,
    error,
    refresh,
  };
}
