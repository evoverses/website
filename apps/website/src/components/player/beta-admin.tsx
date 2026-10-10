"use client";
import { useRef, useState } from "react";
import type { BetaAdminSnapshot } from "@/lib/player/beta-admin-handler";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@workspace/ui/components/dialog";

type Player = BetaAdminSnapshot["players"][number];
type Action = "approve" | "revoke" | "promote_admin" | "revoke_admin" | "grant_evoros" | "grant_item";
type Sort = "name" | "experience" | "access" | "administrator" | "evoros";
const errors: Record<string, string> = { MASTER_ADMINISTRATOR_PROTECTED: "Master administrators cannot be revoked through this panel.", LAST_ADMINISTRATOR: "The last administrator cannot be removed. Make another account admin first.", ADMIN_REQUIRED: "Unauthorised. An administrator account is required.", INVALID_SESSION: "Your session expired. Sign in again.", TESTER_NOT_APPROVED: "Approve this beta tester first.", ADMIN_ACCOUNT_PROTECTED: "Administrator accounts cannot be revoked here.", STALE_ACCESS: "The account changed. Refresh before trying again.", RETRY_CONFLICT: "This request was already used for another action.", PLAYER_UNAVAILABLE: "This account is unavailable.", CAPACITY_EXCEEDED: "The grant exceeds the supported balance or inventory size.", PRODUCT_UNAVAILABLE: "This item is unavailable.", RATE_LIMITED: "Please wait before trying again." };
export function BetaAdmin({ initialSnapshot }: { initialSnapshot: BetaAdminSnapshot }) {
  const [unauthorised, setUnauthorised] = useState(false);
  const [snapshot, setSnapshot] = useState(initialSnapshot), [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>("name"), [direction, setDirection] = useState<"asc" | "desc">("asc");
  const [busy, setBusy] = useState(false), [error, setError] = useState<string>(), [message, setMessage] = useState<string>();
  const [selection, setSelection] = useState<{ player: Player; action: Action }>();
  const [amount, setAmount] = useState("500"), [quantity, setQuantity] = useState("1"), [product, setProduct] = useState(initialSnapshot.products[0]?.productId ?? ""), [reason, setReason] = useState("");
  const [pending, setPending] = useState<Record<string, unknown>>(); const inFlight = useRef(false);
  async function rpc(operation: "list" | "action", input: unknown) {
    let response: Response;
    try { response = await fetch("/api/player/beta-admin", { method: "POST", headers: { "content-type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ operation, input }), cache: "no-store", signal: AbortSignal.timeout(12000) }); }
    catch { throw Error("NETWORK_UNCERTAIN"); }
    let value; try { value = await response.json(); } catch { throw Error("NETWORK_UNCERTAIN"); }
    if (!response.ok) { if (["ADMIN_REQUIRED", "INVALID_SESSION"].includes(value.error?.code)) setUnauthorised(true); throw Error(value.error?.code ?? "BETA_ADMIN_UNAVAILABLE"); }
    return value;
  }
  async function load(page = 1, nextSort = sort, nextDirection = direction) {
    if (inFlight.current || pending) return; inFlight.current = true; setBusy(true); setError(undefined);
    try { const data: BetaAdminSnapshot = await rpc("list", { search, sort: nextSort, direction: nextDirection, page }); setSnapshot(data); setSort(nextSort); setDirection(nextDirection); }
    catch (failure) { setError(errors[(failure as Error).message] ?? "Refresh failed. The last verified list has been retained."); }
    finally { inFlight.current = false; setBusy(false); }
  }
  function choose(player: Player, action: Action) { setSelection({ player, action }); setReason(""); setError(undefined); }
  const item = snapshot.products.find(p => p.productId === product);
  const description = !selection ? "" : selection.action === "approve" ? "Approve for beta and grant the initial 5,000 Evoros once." : selection.action === "revoke" ? "Remove beta tester approval. Account login, administrator access, inventory and balance are retained." : selection.action === "promote_admin" ? "Make this player an administrator. They will be able to approve testers, promote administrators and grant rewards." : selection.action === "revoke_admin" ? "Remove administrator permissions. Beta tester status, XP, balance and account login are retained." : selection.action === "grant_evoros" ? `Add ${Number(amount).toLocaleString()} Evoros to their existing balance.` : `Grant ${quantity} × ${item?.name ?? "item"}${item?.packSize ? " (unopened)" : ""}.`;
  const validAmount = Number.isSafeInteger(Number(amount)) && Number(amount) > 0 && Number(amount) <= 2147483647;
  const validQuantity = Number.isSafeInteger(Number(quantity)) && Number(quantity) > 0 && Number(quantity) <= 1000;
  async function confirm() {
    if (!selection || inFlight.current) return;
    const { player, action } = selection;
    const input = pending ?? { requestId: crypto.randomUUID(), playerId: player.id, action, reason: reason.trim(), ...(action === "approve" || action === "revoke" ? { expectedVersion: player.version } : action === "grant_evoros" ? { amount: Number(amount) } : action === "grant_item" ? { productId: item?.productId, revision: item?.revision, quantity: Number(quantity) } : {}) };
    setPending(input); inFlight.current = true; setBusy(true); setError(undefined); setMessage(undefined);
    try {
      await rpc("action", input); setPending(undefined); setSelection(undefined); setMessage(`Saved for ${player.displayName}.`);
      try { setSnapshot(await rpc("list", { search, sort, direction, page: snapshot.page })); }
      catch { setError("The change is saved, but refresh failed. Refresh the list; do not repeat the grant."); }
    } catch (failure) {
      const code = (failure as Error).message;
      if (!["NETWORK_UNCERTAIN", "BETA_ADMIN_UNAVAILABLE"].includes(code)) setPending(undefined);
      setError(errors[code] ?? "Confirmation is uncertain. Retry the saved request safely; do not create another grant.");
    } finally { inFlight.current = false; setBusy(false); }
  }
  function heading(key: Sort, label: string) { return <th className="p-3 text-left" aria-sort={sort === key ? direction === "asc" ? "ascending" : "descending" : "none"}><button className="font-semibold whitespace-nowrap" disabled={busy || !!pending} onClick={() => void load(1, key, sort === key && direction === "asc" ? "desc" : "asc")}>{label}{sort === key ? direction === "asc" ? " ↑" : " ↓" : ""}</button></th>; }
  if (unauthorised) return <div><h2 className="text-2xl font-bold">Unauthorised</h2><p>An administrator account is required.</p></div>;
  return <div className="space-y-5">
    <form className="flex flex-wrap gap-3" onSubmit={e => { e.preventDefault(); void load(); }}><Input className="max-w-md" aria-label="Search accounts" placeholder="Search player name" maxLength={80} value={search} onChange={e => setSearch(e.target.value)} disabled={busy || !!pending} /><Button disabled={busy || !!pending}>Search / Refresh</Button></form>
    <div className="overflow-x-auto rounded-xl border bg-card"><table className="w-full min-w-[850px] text-sm"><caption className="sr-only">Player accounts, beta status, XP, administrator permissions and Evoros balances</caption><thead><tr className="border-b">{heading("name", "Account")}{heading("access", "Beta status")}{heading("experience", "Player XP")}{heading("administrator", "Admin")}{heading("evoros", "Evoros balance")}<th className="p-3 text-left">Actions</th></tr></thead><tbody>{snapshot.players.map(player => <tr key={player.id} className="border-b last:border-0"><td className="p-3 font-semibold">{player.displayName}<span className="block text-xs font-normal text-muted-foreground">{player.id.slice(0, 8)}</span></td><td className="p-3 capitalize">{player.access}{player.accountStatus !== "active" && <span className="block text-xs">{player.accountStatus}</span>}</td><td className="p-3 tabular-nums">{player.experience.toLocaleString()}</td><td className="p-3">{player.masterAdministrator ? "Master" : player.administrator ? "Yes" : "No"}</td><td className="p-3 tabular-nums">{player.evoros.toLocaleString()}</td><td className="p-3"><div className="flex flex-wrap gap-2">
      {player.access !== "approved" ? <Button size="sm" disabled={busy || !!pending || player.accountStatus === "closed"} onClick={() => choose(player, "approve")}>Approve beta</Button> : <Button size="sm" variant="outline" disabled={busy || !!pending} onClick={() => choose(player, "revoke")}>Revoke beta</Button>}
      {player.administrator && <Button size="sm" variant="outline" title={player.masterAdministrator ? "Protected master administrator" : undefined} disabled={busy || !!pending || player.masterAdministrator} onClick={() => choose(player, "revoke_admin")}>Revoke admin</Button>}
      {!player.administrator && <Button size="sm" variant="outline" disabled={busy || !!pending || player.accountStatus !== "active"} onClick={() => choose(player, "promote_admin")}>Make admin</Button>}
      <Button size="sm" variant="outline" disabled={busy || !!pending || player.accountStatus !== "active"} onClick={() => choose(player, "grant_evoros")}>Add Evoros</Button><Button size="sm" variant="outline" disabled={busy || !!pending || player.accountStatus !== "active"} onClick={() => choose(player, "grant_item")}>Items / packs</Button>
    </div></td></tr>)}{!snapshot.players.length && <tr><td className="p-6" colSpan={6}>No accounts match your search.</td></tr>}</tbody></table></div>
    <div className="flex items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{snapshot.total.toLocaleString()} accounts · Page {snapshot.page}</p><div className="flex gap-2"><Button variant="outline" disabled={busy || !!pending || snapshot.page <= 1} onClick={() => void load(snapshot.page - 1)}>Previous</Button><Button variant="outline" disabled={busy || !!pending || !snapshot.more} onClick={() => void load(snapshot.page + 1)}>Next</Button></div></div>
    {busy && <p role="status">Checking the account service…</p>}{message && <p role="status" className="text-primary">{message}</p>}{error && <p role="alert" className="text-destructive">{error}</p>}
    <Dialog open={!!selection} onOpenChange={open => { if (!open && !busy && !pending) setSelection(undefined); }}><DialogContent onInteractOutside={e => { if (busy || pending) e.preventDefault(); }} onEscapeKeyDown={e => { if (busy || pending) e.preventDefault(); }}><DialogHeader><DialogTitle>Confirm change for {selection?.player.displayName}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>
      {selection?.action === "grant_evoros" && <div className="space-y-2"><Label htmlFor="grant-amount">Evoros to add</Label><Input id="grant-amount" type="number" min={1} max={2147483647} step={1} value={amount} onChange={e => setAmount(e.target.value)} disabled={busy || !!pending} /><p className="text-sm text-muted-foreground">Current balance: {selection.player.evoros.toLocaleString()} · After grant: {(selection.player.evoros + (validAmount ? Number(amount) : 0)).toLocaleString()}</p></div>}
      {selection?.action === "grant_item" && <><Label htmlFor="reward-product">Item / unopened pack</Label><select id="reward-product" className="rounded-md border bg-card p-2" value={product} onChange={e => setProduct(e.target.value)} disabled={busy || !!pending}>{snapshot.products.map(p => <option key={p.productId} value={p.productId}>{p.name}</option>)}</select><Label htmlFor="reward-quantity">Quantity</Label><Input id="reward-quantity" type="number" min={1} max={1000} step={1} value={quantity} onChange={e => setQuantity(e.target.value)} disabled={busy || !!pending} /></>}
      <Label htmlFor="admin-reason">Reason (saved in the audit)</Label><Input id="admin-reason" maxLength={200} value={reason} onChange={e => setReason(e.target.value)} disabled={busy || !!pending} placeholder="e.g. Beta tester approval or event reward" />{error && <p role="alert" className="text-destructive">{error}</p>}
      <DialogFooter><Button variant="outline" disabled={busy || !!pending} onClick={() => setSelection(undefined)}>Cancel</Button><Button disabled={busy || (!pending && (!reason.trim() || selection?.action === "grant_evoros" && !validAmount || selection?.action === "grant_item" && (!validQuantity || !item)))} onClick={() => void confirm()}>{pending ? "Retry saved request" : "Confirm"}</Button></DialogFooter>
    </DialogContent></Dialog>
    <details className="rounded-xl border p-4"><summary className="cursor-pointer font-semibold">Recent audit history</summary><ul className="mt-4 space-y-3 text-sm">{snapshot.history.map(h => <li key={h.id}><strong>{h.displayName} · {h.action.replaceAll("_", " ")}</strong><p>{h.reason} · {new Date(h.createdAt).toLocaleString()}</p></li>)}</ul></details>
  </div>;
}
