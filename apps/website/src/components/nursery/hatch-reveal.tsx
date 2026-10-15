"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { decodeEventLog, parseAbiItem, type Hex } from "viem";
import { toTitleCase } from "@workspace/evoverses/utils/strings";
import ReactConfetti from "react-confetti";
import { useWindowSize } from "usehooks-ts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { EvoCard } from "@workspace/evoverses/components/evo-card";
import type { SquidAsset } from "@workspace/evoverses/lib/asset/types";
import { hermannAddress, nurseryClient, nurseryScope, sameAddress } from "@/lib/nursery/contracts";
import { nurseryChain, nurseryNftAddress } from "@/lib/nursery/network";
import { readHatchReveals, rememberHatch, type HatchRevealRecord } from "@/lib/nursery/hatch-reveal-store";

const hatchedEvent = parseAbiItem("event EggHatched(uint256 indexed tokenId,uint256 indexed vrfRequestId,bytes32 traitsHash)");

export function useHatchReveals(owner?: string) {
  const key = `evo-nursery:reveals:v1:${nurseryScope}:${owner?.toLowerCase()}`;
  const currentKey = useRef(key); currentKey.current = key;
  const [snapshot, setSnapshot] = useState<{ key: string; records: HatchRevealRecord[] }>({ key: "", records: [] });
  useEffect(() => { let records: HatchRevealRecord[] = []; try { records = readHatchReveals(localStorage.getItem(key)); } catch { /* In-memory reveals still work. */ } setSnapshot({ key, records }); }, [key]);
  const change = useCallback((edit: (records: HatchRevealRecord[]) => HatchRevealRecord[]) => {
    setSnapshot(previous => {
      let records = previous.key === key ? previous.records : [];
      try { if (previous.key !== key) records = readHatchReveals(localStorage.getItem(key)); } catch { /* Browser storage can be unavailable. */ }
      const next = edit(records);
      try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* The receipt remains independently recoverable. */ }
      return currentKey.current === key ? { key, records: next } : previous;
    });
  }, [key]);
  const records = snapshot.key === key ? snapshot.records : [];
  const remember = useCallback((tokenId: string, hash?: Hex) => change(records => rememberHatch(records, tokenId, hash)), [change]);
  const update = useCallback((record: HatchRevealRecord, patch: Partial<Pick<HatchRevealRecord, "dismissed" | "celebrated">>) => change(records => records.map(item => item.tokenId === record.tokenId && item.hash === record.hash ? { ...item, ...patch } : item)), [change]);
  const reopen = useCallback((record: HatchRevealRecord) => update(record, { dismissed: false, celebrated: true }), [update]);
  return { records, remember, reopen, update, pending: records.find(record => !record.dismissed) };
}

export function HatchReveal({ record, owner, close, celebrated }: { record: HatchRevealRecord; owner: string; close: () => void; celebrated: () => void }) {
  const [artReady, setArtReady] = useState(false), [artError, setArtError] = useState(false), [artAttempt, setArtAttempt] = useState(0);
  const [shower, setShower] = useState(false), [reduceMotion, setReduceMotion] = useState(true);
  const { width, height } = useWindowSize();
  useEffect(() => { const media = matchMedia("(prefers-reduced-motion: reduce)"); const update = () => setReduceMotion(media.matches); update(); media.addEventListener("change", update); return () => media.removeEventListener("change", update); }, []);
  const receipt = useQuery({
    queryKey: ["nursery-hatch-reveal-receipt", nurseryScope, record.hash], enabled: Boolean(record.hash), retry: false,
    refetchInterval: query => query.state.data ? false : 3_000,
    queryFn: async () => {
      try { return await nurseryClient.getTransactionReceipt({ hash: record.hash! }); }
      catch (error) { if (error instanceof Error && error.name === "TransactionReceiptNotFoundError") return null; throw error; }
    },
  });
  const validReceipt = !record.hash || receipt.data?.status === "success" && receipt.data.logs.some(log => {
    if (!sameAddress(log.address, hermannAddress!)) return false;
    try { const event = decodeEventLog({ abi: [hatchedEvent], ...log }); return event.eventName === "EggHatched" && String(event.args.tokenId) === record.tokenId; } catch { return false; }
  });
  const asset = useQuery({
    queryKey: ["nursery-hatch-reveal-asset", nurseryScope, owner.toLowerCase(), record.tokenId, record.hash], enabled: Boolean(validReceipt), retry: false,
    refetchInterval: query => query.state.data ? false : 3_000,
    queryFn: async () => {
      const response = await fetch(`/api/nursery/evos/${record.tokenId}?${new URLSearchParams({ owner })}`, { cache: "no-store", redirect: "error" });
      if (!response.ok) { const result = await response.json().catch(() => ({})); throw Error(result.error === "NFT_OWNER_CHANGED" ? "This Evo is now in a different wallet." : "Your Evo card could not be loaded. Try again shortly."); }
      const result = await response.json() as { asset: SquidAsset; blockNumber: string };
      const evo = result.asset;
      if (!evo || evo.metadata.type !== "EVO" || evo.tokenId !== record.tokenId || evo.chainId !== String(nurseryChain.id) || !sameAddress(evo.address, nurseryNftAddress) || !sameAddress(evo.owner, owner) || receipt.data && BigInt(result.blockNumber) < receipt.data.blockNumber) throw Error("The confirmed Evo card is still updating. Try again shortly.");
      return evo;
    },
  });
  useEffect(() => {
    if (!asset.data || !artReady || record.celebrated || !record.hash) return;
    celebrated();
    if (!reduceMotion) setShower(true);
  }, [asset.data, artReady, record.celebrated, record.hash, reduceMotion, celebrated]);
  useEffect(() => { if (!shower) return; const timer = setTimeout(() => setShower(false), 10_000); return () => clearTimeout(timer); }, [shower]);
  const failed = receipt.data?.status === "reverted";
  const invalid = Boolean(record.hash && receipt.data?.status === "success" && !validReceipt);
  if (record.hash && !receipt.data && !receipt.isError) return null;
  return <>
    {shower && !reduceMotion && <div className="pointer-events-none fixed inset-0 z-[100]" aria-hidden="true"><ReactConfetti width={width} height={height} numberOfPieces={160} recycle /></div>}
    <Dialog open onOpenChange={open => { if (!open) close(); }}><DialogContent className="w-[calc(100%-2rem)] max-w-sm max-h-[90dvh] overflow-y-auto text-foreground">
      <DialogHeader><DialogTitle>{failed ? "Hatch transaction failed" : asset.data ? `Meet ${toTitleCase(asset.data.metadata.species)} #${record.tokenId}!` : `Evo #${record.tokenId}`}</DialogTitle><DialogDescription>{failed ? "Your egg remains in its previous state. Check the transaction before trying again." : invalid ? "This transaction does not confirm this egg’s hatch." : asset.data ? `Your generation ${asset.data.metadata.generation} Evo has hatched.` : validReceipt ? "Hatching confirmed. Loading your Evo card…" : "Waiting for hatch confirmation…"}</DialogDescription></DialogHeader>
      {asset.data && <EvoCard key={artAttempt} asset={asset.data} onArtLoad={() => { setArtReady(true); setArtError(false); }} onArtError={() => { setArtError(true); setArtReady(false); }} />}
      {asset.data && !artReady && !artError && <p role="status" className="text-sm text-muted-foreground">Loading Evo artwork…</p>}
      {artError && <div className="space-y-2"><p role="status" className="text-sm">The artwork could not load. Your Evo has hatched successfully.</p><Button variant="outline" onClick={() => { setArtError(false); setArtAttempt(value => value + 1); }}>Retry artwork</Button></div>}
      {(asset.isError || receipt.isError) && <div className="space-y-2"><p role="status" className="text-sm">{asset.error?.message ?? "Confirmation could not be checked. Your transaction is saved."}</p><Button variant="outline" onClick={() => { void receipt.refetch(); void asset.refetch(); }}>Retry</Button></div>}
      <div className="flex flex-wrap gap-2"><Button onClick={close}>Close</Button>{record.hash && <Button variant="outline" asChild><a href={`${nurseryChain.blockExplorers.default.url}/tx/${record.hash}`} target="_blank" rel="noreferrer">View transaction</a></Button>}</div>
    </DialogContent></Dialog>
  </>;
}
