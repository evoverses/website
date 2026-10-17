"use client";

import { useState, type KeyboardEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trophy, RefreshCw } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { parseBoard, parsePosition, type ProgressionBoard, type ProgressionEntry } from "@/lib/leaderboard/boards-core";
import type { Period } from "@/lib/leaderboard/core";
import { LeaderboardNavigation } from "./leaderboard-navigation";

const periods: [Period, string][] = [["day", "Day"], ["week", "Week"], ["month", "Month"], ["all", "All-time"]];
const number = (value: number) => value.toLocaleString("en-US");
function periodKey(event: KeyboardEvent<HTMLButtonElement>) {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
  const tabs = Array.from(event.currentTarget.parentElement!.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const index = tabs.indexOf(event.currentTarget);
  const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
  event.preventDefault(); tabs[next]!.focus(); tabs[next]!.click();
}
function Rank({value}: {value: number}) {
  const medals: Record<number, {label: string; color: string}> = {
    1: {label: "Gold trophy", color: "text-yellow-400"}, 2: {label: "Silver trophy", color: "text-slate-300"}, 3: {label: "Bronze trophy", color: "text-amber-600"},
  };
  const medal = medals[value];
  return <span className="inline-flex items-center justify-end gap-2">{medal ? <Trophy role="img" aria-label={medal.label} className={`size-4 shrink-0 ${medal.color}`}/> : null}{number(value)}</span>;
}
function Position({entry, winsBased}: {entry: ProgressionEntry; winsBased: boolean}) {
  return <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/40 bg-primary/10 p-4">
    <span>Your position: <strong>#{number(entry.rank)} · {entry.name}</strong></span>
    <span className="font-bold tabular-nums">{winsBased ? `${number(entry.wins)} wins` : `${number(entry.totalXp)} XP`} · Level {entry.level}</span>
  </div>;
}
export function ProgressionLeaderboard({board, viewerId}: {board: ProgressionBoard; viewerId: string | null}) {
  const [period, setPeriod] = useState<Period>(board === "overall" ? "all" : "day");
  const [page, setPage] = useState(0);
  const tabs: [Period, string][] = board === "overall" ? [["all", "All-time"]] : periods;
  const title = board === "pvbot" ? "PvBot Leaderboard" : "Overall Trainer Leaderboard";
  const rankings = useQuery({queryKey: ["progression-leaderboard", board, period, page], queryFn: async ({signal}) => {
    const response = await fetch(`/api/leaderboard/${board}?period=${period}&page=${page}`, {cache: "no-store", credentials: "omit", signal});
    if (!response.ok) throw Error("Leaderboard unavailable");
    return parseBoard(await response.json(), {board, period, page});
  }, staleTime: 60000, retry: 1, placeholderData: previous => previous?.board === board ? previous : undefined});
  const own = useQuery({queryKey: ["progression-leaderboard-own", board, period, viewerId], enabled: !!viewerId,
    meta: {private: true}, gcTime: 0, staleTime: 0, retry: 1, queryFn: async ({signal}) => {
      const response = await fetch(`/api/leaderboard/${board}/me?period=${period}&page=0`, {cache: "no-store", credentials: "same-origin", signal});
      if (!response.ok) throw Error("Position unavailable");
      return parsePosition(await response.json(), board);
    }});
  const data = rankings.data;
  const showingCurrent = data?.board === board && data.period === period && data.page === page;
  const winsBased = board === "pvbot" && (data?.period ?? period) !== "all";
  const columns = ["Rank", "Trainer", "Level", "PvP XP", "PvBot XP", ...(winsBased ? ["Total XP"] : []), "Battles", ...(!winsBased ? ["Wins"] : []), "Losses", "Win rate", winsBased ? "Wins" : "Total XP"];
  const periodDescription = period === "all" ? "All-time results." : period === "day" ? "Today from midnight UTC." : period === "week" ? "This week from Monday at midnight UTC." : "This month from the first day at midnight UTC.";
  return <main className="mx-auto max-w-7xl space-y-5 px-3 py-6 sm:px-6">
    <LeaderboardNavigation active={board}/>
    <header className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/15 to-card p-6">
      <div className="flex items-center gap-3"><Trophy aria-hidden="true" className="size-9 shrink-0 text-primary"/><h1 className="text-3xl font-extrabold">{title}</h1></div>
      <p className="mt-3 text-muted-foreground">{board === "pvbot" ? "Remote ranked PvBot results count here. Day, week and month rank by wins, with fewer losses breaking ties. All-time ranks by lifetime earned PvBot XP." : "Qualifying PvP and remote ranked PvBot Trainer XP combine into one all-time ranking. The breakdown shows how you earned your total."}</p>
    </header>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div role="tablist" aria-label="Ranking period" className="flex flex-wrap gap-2">{tabs.map(([id, text]) => <Button key={id} role="tab" id={`${board}-tab-${id}`} aria-controls={`${board}-panel`} tabIndex={period === id ? 0 : -1} onKeyDown={periodKey}
        aria-selected={period === id} variant={period === id ? "default" : "outline"} onClick={() => {setPeriod(id); setPage(0);}}>{text}</Button>)}</div>
      <Button variant="outline" disabled={rankings.isFetching} onClick={() => {void rankings.refetch(); if (viewerId) void own.refetch();}}><RefreshCw aria-hidden="true" className={`mr-2 size-4 ${rankings.isFetching ? "animate-spin" : ""}`}/>Refresh</Button>
    </div>
    <p className="text-sm text-muted-foreground">{periodDescription} Battle statistics use the selected period; XP columns show lifetime earned Trainer XP. Updates may take up to a minute.</p>
    <ul className="list-disc space-y-1 pl-5 text-sm">
      <li>Local practice and friendly battles do not count. Remote ranked PvBot earns XP and has its own results.</li>
      <li>{board === "pvbot" ? "Equal wins and losses share rank in calendar periods. Equal earned XP shares rank for all-time." : "Equal combined earned XP shares rank. Trainer XP counts once; Evo XP is excluded."}</li>
      <li>Earned XP continues to count after progression caps. These boards have no prizes or Pro leaderboard eligibility.</li>
    </ul>
    {viewerId ? own.data?.own ? <Position entry={own.data.own} winsBased={board === "pvbot" && period !== "all"}/> : <p className="text-sm text-muted-foreground">{own.isError ? "Your position is temporarily unavailable." : own.isPending ? "Loading your position…" : "You have no qualifying activity in this period yet."}</p> : null}
    {rankings.isError ? <p role="alert" className="rounded-lg border border-destructive/40 p-3">The leaderboard is temporarily unavailable.{data ? " Showing the last successful results." : " Please try again."}</p> : null}
    {!showingCurrent && data ? <p role="status" className="text-sm text-muted-foreground">{rankings.isError ? "Last loaded period:" : "Loading your selection; showing previous results:"} {periods.find(([id]) => id === data.period)?.[1]}</p> : null}
    <section role="tabpanel" id={`${board}-panel`} aria-labelledby={`${board}-tab-${period}`} aria-busy={rankings.isFetching} className="overflow-hidden rounded-2xl border bg-card">
      <div className="overflow-x-auto"><table className="w-full min-w-[940px] text-sm"><caption className="sr-only">{title}. {winsBased ? "Ranked by wins and fewer losses." : "Ranked by lifetime earned Trainer XP."}</caption>
        <thead className="bg-primary/10"><tr>{columns.map(text => <th key={text} scope="col" className={`whitespace-nowrap px-4 py-4 ${text === "Trainer" ? "text-left" : "text-right"}`}>{text}</th>)}</tr></thead>
        <tbody>{data?.entries.map((row, index) => <tr key={`${row.rank}:${row.name}:${index}`} className={`border-t ${showingCurrent && own.data?.ownRow === data.page * 50 + index + 1 ? "bg-primary/10" : "hover:bg-muted/40"}`}>
          <td className="px-4 py-4 text-right font-bold"><Rank value={row.rank}/></td><th scope="row" className="max-w-64 truncate px-4 py-4 text-left font-semibold" title={row.name}>{row.name}</th>
          {[row.level, number(row.pvpXp), number(row.pvbotXp), ...(winsBased ? [number(row.totalXp)] : []), number(row.battles), ...(!winsBased ? [number(row.wins)] : []), number(row.losses), row.winRate === null ? "—" : `${row.winRate.toFixed(1)}%`, winsBased ? number(row.wins) : number(row.totalXp)].map((value, cell) => <td key={cell} className={`whitespace-nowrap px-4 py-4 text-right tabular-nums ${cell === 7 ? "font-bold text-primary" : ""}`}>{value}</td>)}
        </tr>)}</tbody>
      </table></div>
      {!data && rankings.isPending ? <p role="status" className="p-8 text-center text-muted-foreground">Loading trainer rankings…</p> : null}
      {data?.entries.length === 0 ? <p className="p-8 text-center text-muted-foreground">{data.total === 0 ? "No qualifying results yet. Play a remote ranked battle to join this leaderboard." : "No trainers on this page."}</p> : null}
    </section>
    {data ? <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground"><span>{data.periodStart ? `From ${new Date(data.periodStart).toUTCString()} · ` : ""}Updated {new Date(data.calculatedAt).toUTCString()}</span>
      <div className="flex items-center gap-3"><Button variant="outline" disabled={page === 0 || rankings.isFetching} onClick={() => setPage(value => value - 1)}>Previous</Button><span>Page {page + 1} of {Math.max(1, Math.ceil(data.total / 50))}</span><Button variant="outline" disabled={(page + 1) * 50 >= data.total || rankings.isFetching} onClick={() => setPage(value => value + 1)}>Next</Button></div>
    </div> : null}
  </main>;
}
