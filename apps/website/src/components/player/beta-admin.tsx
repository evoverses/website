"use client";
import { useRef, useState } from "react";
import type { BetaAdminSnapshot } from "@/lib/player/beta-admin-handler";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@workspace/ui/components/dialog";

type Player = BetaAdminSnapshot["players"][number];
type Action = "delete" | "ban" | "unban" | "approve" | "revoke" | "promote_admin" | "revoke_admin" | "grant_evoros" | "grant_item";
type Sort = "name" | "experience" | "access" | "administrator" | "evoros";
const errors: Record<string, string> = { SELF_DELETE_PROTECTED: "You cannot delete your own account.", ACCOUNT_IN_BATTLE: "This account is in a battle. Finish or release the battle before deleting it.", SELF_BAN_PROTECTED: "You cannot ban your own administrator account.", MASTER_ADMINISTRATOR_PROTECTED: "Master administrators cannot be revoked through this panel.", LAST_ADMINISTRATOR: "The last administrator cannot be removed. Make another account admin first.", ADMIN_REQUIRED: "Unauthorised. An administrator account is required.", INVALID_SESSION: "Your session expired. Sign in again.", TESTER_NOT_APPROVED: "Approve this beta tester first.", ADMIN_ACCOUNT_PROTECTED: "Administrator accounts cannot be revoked here.", STALE_ACCESS: "The account changed. Refresh before trying again.", RETRY_CONFLICT: "This request was already used for another action.", PLAYER_UNAVAILABLE: "This account is unavailable.", CAPACITY_EXCEEDED: "The grant exceeds the supported balance or inventory size.", PRODUCT_UNAVAILABLE: "This item is unavailable.", RATE_LIMITED: "Please wait before trying again." };
export function BetaAdmin({ initialSnapshot }: { initialSnapshot: BetaAdminSnapshot }) {
  const [unauthorised, setUnauthorised] = useState(false);
  const [snapshot, setSnapshot] = useState(initialSnapshot), [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>("name"), [direction, setDirection] = useState<"asc" | "desc">("asc");
  const [busy, setBusy] = useState(false), [error, setError] = useState<string>(), [message, setMessage] = useState<string>();
  const [selection, setSelection] = useState<{ players: Player[]; action: Action; excluded?: number }>();
  const [amount, setAmount] = useState("500"), [quantity, setQuantity] = useState("1"), [product, setProduct] = useState(initialSnapshot.products[0]?.productId ?? ""), [reason, setReason] = useState("");
  const [checked, setChecked] = useState<string[]>([]), [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [pending, setPending] = useState<{ queue: {player: Player; input: Record<string, unknown>}[]; index: number; saved: string[]; failed: string[] }>(); const inFlight = useRef(false);
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
    try { const data: BetaAdminSnapshot = await rpc("list", { search, sort: nextSort, direction: nextDirection, page }); setSnapshot(data); setChecked([]); setSort(nextSort); setDirection(nextDirection); }
    catch (failure) { setError(errors[(failure as Error).message] ?? "Refresh failed. The last verified list has been retained."); }
    finally { inFlight.current = false; setBusy(false); }
  }
  function eligible(player: Player, action: Action) {
    if (player.accountStatus === "closed") return false;
    if (action === "delete") return !player.administrator && player.id !== snapshot.administratorId;
    if (action === "ban") return player.accountStatus === "active" && !player.masterAdministrator && player.id !== snapshot.administratorId;
    if (action === "unban") return player.accountStatus === "suspended";
    if (action === "revoke_admin") return player.administrator && !player.masterAdministrator && player.id !== snapshot.administratorId && player.accountStatus === "active";
    if (action === "approve") return player.accountStatus === "active" && player.access !== "approved";
    if (action === "revoke") return player.access === "approved";
    if (action === "promote_admin") return !player.administrator && player.accountStatus === "active";
    return player.accountStatus === "active";
  }
  function choose(player: Player, action: Action) { setSelection({ players: [player], action }); setReason(""); setDeleteConfirmation(""); setError(undefined); }
  function chooseMany(action: Exclude<Action, "promote_admin">) {
    const players = snapshot.players.filter(p => checked.includes(p.id) && eligible(p, action));
    if (!players.length) { setError("None of the selected accounts are eligible for this action."); return; }
    setSelection({players, action, excluded: checked.length - players.length}); setReason(""); setDeleteConfirmation(""); setError(undefined);
  }
  function toggle(id: string) { setChecked(ids => ids.includes(id) ? ids.filter(value => value !== id) : ids.length < 50 ? [...ids, id] : ids); }
  const item = snapshot.products.find(p => p.productId === product);
  const description = !selection ? "" : selection.action === "delete" ? "Permanently close these accounts, revoke sessions, unlink wallets and remove them from the account list. They cannot sign in again. Audit, financial and inventory records are retained. This cannot be undone from this panel." : selection.action === "ban" ? "Ban this account from the game and account services. Existing sessions will be revoked. Inventory, balance, beta approval and administrator membership are retained." : selection.action === "unban" ? "Restore account access. The player must sign in again; previous sessions stay revoked." : selection.action === "approve" ? "Approve for beta and grant the initial 5,000 Evoros once." : selection.action === "revoke" ? "Remove beta tester approval. Account login, administrator access, inventory and balance are retained." : selection.action === "promote_admin" ? "Make this player an administrator. They will be able to approve testers, promote administrators and grant rewards." : selection.action === "revoke_admin" ? "Remove administrator permissions. Beta tester status, XP, balance and account login are retained." : selection.action === "grant_evoros" ? `Add ${Number(amount).toLocaleString()} Evoros to their existing balance.` : `Grant ${quantity} × ${item?.name ?? "item"}${item?.packSize ? " (unopened)" : ""}.`;
  const validAmount = Number.isSafeInteger(Number(amount)) && Number(amount) > 0 && Number(amount) <= 2147483647;
  const validQuantity = Number.isSafeInteger(Number(quantity)) && Number(quantity) > 0 && Number(quantity) <= 1000;
  async function confirm() {
    if (!selection || inFlight.current) return;
    const action = selection.action;
    if (!pending && (action === "delete" && deleteConfirmation !== "DELETE" || !reason.trim())) return;
    const work = pending ?? {queue: selection.players.map(player => ({player, input: {requestId: crypto.randomUUID(), playerId: player.id, action, reason: reason.trim(), ...(["ban", "unban", "delete"].includes(action) ? {expectedAccountStatus: player.accountStatus} : action === "approve" || action === "revoke" ? {expectedVersion: player.version} : action === "grant_evoros" ? {amount: Number(amount)} : action === "grant_item" ? {productId: item?.productId, revision: item?.revision, quantity: Number(quantity)} : {})}})), index: 0, saved: [] as string[], failed: [] as string[]};
    inFlight.current = true; setBusy(true); setError(undefined); setMessage(undefined); setPending(work);
    try {
      while (work.index < work.queue.length) {
        const current = work.queue[work.index]!;
        try { await rpc("action", current.input); work.saved.push(current.player.displayName); }
        catch (failure) {
          const code = (failure as Error).message;
          if (["NETWORK_UNCERTAIN", "BETA_ADMIN_UNAVAILABLE", "RATE_LIMITED"].includes(code)) {
            setPending({...work, saved: [...work.saved], failed: [...work.failed]});
            setError(`${work.saved.length} saved. ${current.player.displayName}: confirmation is pending. Retry the saved request; completed accounts will not be repeated.`); return;
          }
          if (["ADMIN_REQUIRED", "INVALID_SESSION"].includes(code)) { setPending(undefined); return; }
          work.failed.push(`${current.player.displayName}: ${errors[code] ?? "Action rejected"}`);
        }
        work.index++; setPending({...work, saved: [...work.saved], failed: [...work.failed]});
      }
      setPending(undefined); setSelection(undefined); setChecked([]);
      setMessage(`${work.saved.length} account${work.saved.length === 1 ? "" : "s"} updated${work.failed.length ? `; ${work.failed.length} rejected.` : "."}`);
      if (work.failed.length) setError(work.failed.join(" · "));
      try { setSnapshot(await rpc("list", {search, sort, direction, page: snapshot.page})); }
      catch { setError("Changes are saved, but refresh failed. Refresh the list; do not repeat the action."); }
    } finally { inFlight.current = false; setBusy(false); }
  }
  function heading(key: Sort, label: string) { return <th className="p-3 text-left" aria-sort={sort === key ? direction === "asc" ? "ascending" : "descending" : "none"}><button className="font-semibold whitespace-nowrap" disabled={busy || !!pending} onClick={() => void load(1, key, sort === key && direction === "asc" ? "desc" : "asc")}>{label}{sort === key ? direction === "asc" ? " ↑" : " ↓" : ""}</button></th>; }
  if (unauthorised) return <div><h2 className="text-2xl font-bold">Unauthorised</h2><p>An administrator account is required.</p></div>;
  return <div className="space-y-5">
    <form className="flex flex-wrap gap-3" onSubmit={e => { e.preventDefault(); void load(); }}><Input className="max-w-md" aria-label="Search accounts" placeholder="Search player name" maxLength={80} value={search} onChange={e => setSearch(e.target.value)} disabled={busy || !!pending} /><Button disabled={busy || !!pending}>Search / Refresh</Button></form>
    <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3">
      <span className="mr-2 text-sm font-semibold">{checked.length} selected</span>
      {([["approve", "Approve beta"], ["revoke", "Revoke beta"], ["ban", "Ban"], ["unban", "Unban"], ["revoke_admin", "Revoke admin"], ["grant_evoros", "Add Evoros"], ["grant_item", "Items / packs"], ["delete", "Delete"]] as const).map(([action, label]) => <Button key={action} size="sm" variant={action === "delete" ? "destructive" : "outline"} disabled={busy || !!pending || !checked.length} onClick={() => chooseMany(action)}>{label}</Button>)}
      <Button size="sm" variant="ghost" disabled={busy || !!pending || !checked.length} onClick={() => setChecked([])}>Clear selection</Button>
      <p className="basis-full text-xs text-muted-foreground">Select up to 50 accounts on this page. Ineligible accounts are excluded before confirmation. Make admin is available individually only.</p>
    </div>
    <div className="overflow-x-auto rounded-xl border bg-card"><table className="w-full min-w-[850px] whitespace-nowrap text-sm"><caption className="sr-only">Player accounts, beta status, XP, administrator permissions and Evoros balances</caption><thead><tr className="border-b"><th className="p-3"><input type="checkbox" aria-label="Select accounts on this page (up to 50)" checked={snapshot.players.length > 0 && snapshot.players.slice(0,50).every(p => checked.includes(p.id))} disabled={busy || !!pending || !snapshot.players.length} onChange={e => setChecked(e.target.checked ? snapshot.players.slice(0,50).map(p => p.id) : [])} /></th>{heading("name", "Account")}{heading("access", "Beta status")}{heading("experience", "Player XP")}{heading("administrator", "Admin")}{heading("evoros", "Evoros balance")}<th className="p-3 text-left">Actions</th></tr></thead><tbody>{snapshot.players.map(player => <tr key={player.id} className="border-b last:border-0"><td className="p-3"><input type="checkbox" aria-label={`Select ${player.displayName}`} checked={checked.includes(player.id)} disabled={busy || !!pending || checked.length >= 50 && !checked.includes(player.id)} onChange={() => toggle(player.id)} /></td><td className="p-3 font-semibold">{player.displayName}<span className="block text-xs font-normal text-muted-foreground">{player.id.slice(0, 8)}</span></td><td className="p-3 capitalize">{player.access}{player.accountStatus !== "active" && <span className="block text-xs">{player.accountStatus}</span>}</td><td className="p-3 tabular-nums">{player.experience.toLocaleString()}</td><td className="p-3">{player.masterAdministrator ? "Master" : player.administrator ? "Yes" : "No"}</td><td className="p-3 tabular-nums">{player.evoros.toLocaleString()}</td><td className="p-3"><div className="flex flex-nowrap gap-2 [&>button]:shrink-0">
      <Button size="sm" variant="outline" disabled={busy || !!pending || player.accountStatus === "closed" || player.masterAdministrator || player.id === snapshot.administratorId} onClick={() => choose(player, player.accountStatus === "suspended" ? "unban" : "ban")}>{player.accountStatus === "suspended" ? "Unban" : "Ban"}</Button>
      {player.access !== "approved" ? <Button size="sm" disabled={busy || !!pending || player.accountStatus === "closed"} onClick={() => choose(player, "approve")}>Approve beta</Button> : <Button size="sm" variant="outline" disabled={busy || !!pending} onClick={() => choose(player, "revoke")}>Revoke beta</Button>}
      {player.administrator && <Button size="sm" variant="outline" title={player.masterAdministrator ? "Protected master administrator" : undefined} disabled={busy || !!pending || player.masterAdministrator} onClick={() => choose(player, "revoke_admin")}>Revoke admin</Button>}
      {!player.administrator && <Button size="sm" variant="outline" disabled={busy || !!pending || player.accountStatus !== "active"} onClick={() => choose(player, "promote_admin")}>Make admin</Button>}
      <Button size="sm" variant="outline" disabled={busy || !!pending || player.accountStatus !== "active"} onClick={() => choose(player, "grant_evoros")}>Add Evoros</Button><Button size="sm" variant="outline" disabled={busy || !!pending || player.accountStatus !== "active"} onClick={() => choose(player, "grant_item")}>Items / packs</Button>
      <Button size="sm" variant="destructive" disabled={busy || !!pending || !eligible(player, "delete")} title={player.administrator ? "Revoke administrator permissions before deleting" : undefined} onClick={() => choose(player, "delete")}>Delete</Button>
    </div></td></tr>)}{!snapshot.players.length && <tr><td className="p-6" colSpan={7}>No accounts match your search.</td></tr>}</tbody></table></div>
    <div className="flex items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{snapshot.total.toLocaleString()} accounts · Page {snapshot.page}</p><div className="flex gap-2"><Button variant="outline" disabled={busy || !!pending || snapshot.page <= 1} onClick={() => void load(snapshot.page - 1)}>Previous</Button><Button variant="outline" disabled={busy || !!pending || !snapshot.more} onClick={() => void load(snapshot.page + 1)}>Next</Button></div></div>
    {busy && <p role="status">Checking the account service…</p>}{message && <p role="status" className="text-primary">{message}</p>}{error && <p role="alert" className="text-destructive">{error}</p>}
    <Dialog open={!!selection} onOpenChange={open => { if (!open && !busy && !pending) setSelection(undefined); }}><DialogContent onInteractOutside={e => { if (busy || pending) e.preventDefault(); }} onEscapeKeyDown={e => { if (busy || pending) e.preventDefault(); }}><DialogHeader><DialogTitle>Confirm change for {selection?.players.length === 1 ? selection.players[0]?.displayName : `${selection?.players.length ?? 0} accounts`}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>
      {selection && <div className="max-h-32 overflow-y-auto rounded-md border p-2 text-sm">{selection.players.map(p => <div key={p.id}>{p.displayName}</div>)}{!!selection.excluded && <p className="mt-2 text-muted-foreground">{selection.excluded} ineligible selected accounts excluded.</p>}</div>}
      {selection?.action === "delete" && <div className="space-y-2"><Label htmlFor="delete-confirmation">Type DELETE to confirm permanent closure</Label><Input id="delete-confirmation" autoComplete="off" value={deleteConfirmation} onChange={e => setDeleteConfirmation(e.target.value)} disabled={busy || !!pending} /></div>}
      {selection && selection.players.length > 1 && <p className="text-sm text-muted-foreground">The grant amount or quantity applies to each account. Accounts are processed individually; rejected accounts do not undo successful changes.</p>}
      {selection?.action === "grant_evoros" && <div className="space-y-2"><Label htmlFor="grant-amount">Evoros to add</Label><Input id="grant-amount" type="number" min={1} max={2147483647} step={1} value={amount} onChange={e => setAmount(e.target.value)} disabled={busy || !!pending} /><p className="text-sm text-muted-foreground">{selection.players.length === 1 ? `Current balance: ${selection.players[0]!.evoros.toLocaleString()} · After grant: ${(selection.players[0]!.evoros + (validAmount ? Number(amount) : 0)).toLocaleString()}` : `Total grant: ${(selection.players.length * (validAmount ? Number(amount) : 0)).toLocaleString()} Evoros across ${selection.players.length} accounts`}</p></div>}
      {selection?.action === "grant_item" && <><Label htmlFor="reward-product">Item / unopened pack</Label><select id="reward-product" className="rounded-md border bg-card p-2" value={product} onChange={e => setProduct(e.target.value)} disabled={busy || !!pending}>{snapshot.products.map(p => <option key={p.productId} value={p.productId}>{p.name}</option>)}</select><Label htmlFor="reward-quantity">Quantity</Label><Input id="reward-quantity" type="number" min={1} max={1000} step={1} value={quantity} onChange={e => setQuantity(e.target.value)} disabled={busy || !!pending} /></>}
      <Label htmlFor="admin-reason">Reason (saved in the audit)</Label><Input id="admin-reason" maxLength={200} value={reason} onChange={e => setReason(e.target.value)} disabled={busy || !!pending} placeholder="e.g. Beta tester approval or event reward" />{error && <p role="alert" className="text-destructive">{error}</p>}
      <DialogFooter><Button variant="outline" disabled={busy || !!pending} onClick={() => setSelection(undefined)}>Cancel</Button><Button disabled={busy || (!pending && (!reason.trim() || selection?.action === "delete" && deleteConfirmation !== "DELETE" || selection?.action === "grant_evoros" && !validAmount || selection?.action === "grant_item" && (!validQuantity || !item)))} onClick={() => void confirm()}>{pending ? "Retry saved request" : "Confirm"}</Button></DialogFooter>
    </DialogContent></Dialog>
    <details className="rounded-xl border p-4"><summary className="cursor-pointer font-semibold">Recent audit history</summary><ul className="mt-4 space-y-3 text-sm">{snapshot.history.map(h => <li key={h.id}><strong>{h.displayName} · {h.action.replaceAll("_", " ")}</strong><p>{h.reason} · {new Date(h.createdAt).toLocaleString()}</p></li>)}</ul></details>
  </div>;
}
