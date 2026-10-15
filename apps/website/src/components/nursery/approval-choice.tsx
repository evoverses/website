"use client";
import { useEffect, useState } from "react";
import { nurseryChain } from "@/lib/nursery/network";
export function useEvoApprovalPreference(spender: string, owner?: string) {
  const key = `evo-nursery:approval:v1:${nurseryChain.id}:${spender.toLowerCase()}:${owner?.toLowerCase()}`;
  const [snapshot, setSnapshot] = useState<{ key: string; persistent: boolean }>({ key: "", persistent: true });
  const persistent = snapshot.key === key ? snapshot.persistent : true;
  useEffect(() => { let value = true; try { value = localStorage.getItem(key) !== "false"; } catch { /* In-memory choice still works. */ } setSnapshot({ key, persistent: value }); }, [key]);
  const setPersistent = (value: boolean) => { setSnapshot({ key, persistent: value }); try { localStorage.setItem(key, String(value)); } catch { /* A stored preference is not a wallet permission. */ } };
  return { persistent, setPersistent, ready: snapshot.key === key };
}
export function EvoApprovalChoice({ keeper, persistent, setPersistent, disabled }: { keeper: "Bertha" | "Hermann"; persistent: boolean; setPersistent: (value: boolean) => void; disabled: boolean }) {
  return <div className="space-y-1 text-sm"><label className="flex items-center gap-2"><input type="checkbox" className="size-4 accent-primary" checked={persistent} onChange={event => setPersistent(event.target.checked)} disabled={disabled} /><span>Approve once for future actions</span></label><p className="text-xs leading-relaxed text-muted-foreground">{persistent ? `Unlimited EVO approval for ${keeper}. Revoke it anytime in your wallet.` : "Approve only the amount needed. Existing approvals stay active until revoked."}</p></div>;
}
