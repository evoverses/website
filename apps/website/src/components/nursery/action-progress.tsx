"use client";
import { useRef, useState } from "react";
import { progressCopy, type NurseryProgress, type NurseryActionKind } from "@/lib/nursery/progress";
export function useNurseryAction() {
  const [progress, update] = useState<NurseryProgress | null>(null);
  const locked = useRef(false);
  const execute = async (kind: NurseryActionKind, run: (work: () => Promise<void>) => Promise<void>, work: () => Promise<void>) => {
    if (locked.current) return;
    locked.current = true;
    // Set the action before any permission/network await, and retain it until the whole flow settles.
    update({ kind, step: "checking", phase: "preparing" });
    try { await run(work); } finally { locked.current = false; update(null); }
  };
  return { progress, update, execute, copy: progress ? progressCopy(progress) : null };
}
export function NurseryActionProgress({ progress }: { progress: NurseryProgress | null }) {
  if (!progress) return null;
  return <p role="status" aria-live="polite" className="text-sm leading-relaxed break-words text-muted-foreground">{progressCopy(progress).message}</p>;
}
