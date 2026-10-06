import { WalletEvos } from "./wallet-evos";
import { ProOnly } from "@/components/providers/pro-mode-provider";
import type { Inventory, PlayerSnapshot } from "@/lib/player/auth-core";
import { Button } from "@workspace/ui/components/button";
import Link from "next/link";

export function PlayerProfile({ account, inventory }: { account: PlayerSnapshot; inventory: Inventory | null }) {
  return (
    <main className="space-y-6">
      <header className="rounded-2xl border bg-primary/5 p-6">
        <p className="text-sm text-muted-foreground">Your trainer</p>
        <h1 className="mt-1 text-3xl font-extrabold">{account.player.displayName}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Your game progress and inventory are shared with the game through this Epic account.</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border bg-card p-5"><h2 className="font-bold">Evoros balance</h2><p className="mt-3 text-3xl font-extrabold">{account.balance.evoros.toLocaleString("en-US")}</p><p className="mt-2 text-sm text-muted-foreground">Your game-account balance. Top up through the Store.</p><Button variant="outline" asChild className="mt-4"><Link href="/store">View Evoros bundles</Link></Button></section>
        <section className="rounded-2xl border bg-card p-5"><h2 className="font-bold">Player XP</h2><p className="mt-3 text-3xl font-extrabold">{account.player.experience.toLocaleString("en-US")}</p><p className="mt-2 text-sm text-muted-foreground">Your progress as a trainer. Each Evo has its own XP.</p></section>
      </div>
      <section className="space-y-3 rounded-2xl border bg-card p-5">
        <h2 className="text-lg font-bold">Your game inventory</h2>
        {inventory ? <>
          <p className="text-sm text-muted-foreground">{inventory.items.length} item types · {inventory.evos.length} Evos</p>
          {inventory.items.length === 0 && <p>You don’t have any store items yet.</p>}
          {inventory.items.map((item, index) => <p key={item.productId + ":" + item.revision}>Item stack {index + 1}: {item.quantity.toLocaleString("en-US")}</p>)}
          {inventory.evos.length === 0 && <p>You don’t have any Evos in this account yet.</p>}
          {inventory.evos.map(evo => <div key={evo.id} className="rounded-xl bg-muted/40 p-3"><p className="font-bold">{evo.speciesKey}</p><p className="text-sm">{evo.experience.toLocaleString("en-US")} Evo XP</p></div>)}
        </> : <p role="status">We couldn’t load your inventory. Refresh this page to try again.</p>}
      </section>
      <ProOnly><WalletEvos /></ProOnly>
      <form action="/api/player/auth/logout" method="post"><Button variant="outline" type="submit">Sign out</Button></form>
    </main>
  );
}
