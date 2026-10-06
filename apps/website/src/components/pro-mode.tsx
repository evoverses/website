"use client";

import { useProMode } from "@/components/providers/pro-mode-provider";
import { cn } from "@/lib/utils";
import { Button } from "@workspace/ui/components/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { PropsWithChildren } from "react";

export function ProModeButton() {
  const { proMode, ready, setProMode } = useProMode();
  return (
    <Button
      type="button"
      role="switch"
      aria-label="Pro mode"
      aria-checked={proMode}
      disabled={!ready}
      variant={proMode ? "default" : "outline"}
      className="gap-2 rounded-full px-3 text-xs sm:text-sm shrink-0"
      onClick={() => setProMode(!proMode)}
    >
      <span>Pro mode</span>
      <span aria-hidden="true" className={cn("flex h-4 w-7 items-center rounded-full p-0.5", proMode ? "bg-primary-foreground/30" : "bg-muted-foreground/30")}>
        <span className={cn("size-3 rounded-full bg-current transition-transform", proMode && "translate-x-3")} />
      </span>
    </Button>
  );
}

const walletRoutes = ["/marketplace", "/nursery", "/liquidity", "/profile/assets", "/profile/liquidity"];
export function ProModeGate({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const { proMode, ready, setProMode } = useProMode();
  if (!walletRoutes.some(route => pathname === route || pathname.startsWith(route + "/")) || proMode) return children;
  // Also hide bookmarked wallet pages. This is not an authentication boundary.
  if (!ready) return null;
  return (
    <section className="mx-auto my-12 max-w-lg space-y-4 rounded-2xl border bg-card p-8 text-center">
      <h1 className="text-2xl font-bold">Pro mode is off</h1>
      <p className="text-muted-foreground">Turn on Pro mode to see the Marketplace, Nursery and wallet features.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={() => setProMode(true)}>Turn on Pro mode</Button>
        <Button variant="outline" asChild><Link href="/store">Visit the Store</Link></Button>
      </div>
    </section>
  );
}
