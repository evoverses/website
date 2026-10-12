"use client";
import { useState, type KeyboardEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trophy, RefreshCw } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { parseLeaderboard, type Period, type TrainerEntry } from "@/lib/leaderboard/core";
const tabs:[Period,string][]=[["day","Day"],["week","Week"],["month","Month"],["all","All-time"]];
function tabKey(event:KeyboardEvent<HTMLButtonElement>){
 const keys=["ArrowLeft","ArrowRight","Home","End"];if(!keys.includes(event.key))return;
 const tabs=Array.from(event.currentTarget.parentElement!.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
 const index=tabs.indexOf(event.currentTarget),next=event.key==="Home"?0:event.key==="End"?tabs.length-1:(index+(event.key==="ArrowRight"?1:-1)+tabs.length)%tabs.length;
 event.preventDefault();tabs[next]!.focus();tabs[next]!.click();
}
const n=(value:number)=>value.toLocaleString("en-US");
function RankTrophy({rank}:{rank:number}){
 const medals:Record<number,{label:string;color:string}>={1:{label:"Gold trophy",color:"text-yellow-400"},2:{label:"Silver trophy",color:"text-slate-300"},3:{label:"Bronze trophy",color:"text-amber-600"}};
 const medal=medals[rank];return medal?<Trophy role="img" aria-label={medal.label} className={`size-4 shrink-0 ${medal.color}`}/>:null;
}
function Position({entry}:{entry:TrainerEntry}){return <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/40 bg-primary/10 p-4"><span>Your position: <strong>#{n(entry.rank)} · {entry.name}</strong></span><span className="font-bold tabular-nums">{n(entry.periodXp)} XP · Level {entry.level}</span></div>;}
export function TrainerLeaderboard({signedIn}:{signedIn:boolean}){
 const [period,setPeriod]=useState<Period>("day"),[page,setPage]=useState(0);
 const board=useQuery({queryKey:["trainer-leaderboard",period,page],queryFn:async()=>{
  const response=await fetch(`/api/leaderboard?period=${period}&page=${page}`,{cache:"no-store",credentials:"omit"});if(!response.ok)throw Error("Leaderboard unavailable");return parseLeaderboard(await response.json(),{period,page});
 },staleTime:60000,retry:1,placeholderData:previous=>previous});
 const own=useQuery<{own:TrainerEntry|null;ownRow:number|null}>({queryKey:["trainer-leaderboard-own",period],enabled:signedIn,meta:{private:true},queryFn:async()=>{
  const response=await fetch(`/api/leaderboard/me?period=${period}&page=0`,{cache:"no-store",credentials:"same-origin"});if(!response.ok)throw Error("Position unavailable");const result=await response.json();return {own:result.own,ownRow:result.ownRow};
 },staleTime:60000,retry:1});
 const data=board.data,showingCurrent=data?.period===period&&data.page===page;
 const allTime=(data?.period??period)==="all";
 return <main className="mx-auto max-w-7xl space-y-5 px-3 py-6 sm:px-6">
  <header className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/15 to-card p-6"><div className="flex items-center gap-3"><Trophy className="size-9 text-primary"/><h1 className="text-3xl font-extrabold">Trainer Leaderboard</h1></div><p className="mt-3 text-muted-foreground">Earn XP in ranked battles and climb the leaderboard. Your level stops at 100; your leaderboard XP keeps growing.</p></header>
  <div className="flex flex-wrap items-center justify-between gap-3"><div role="tablist" aria-label="Ranking period" className="flex flex-wrap gap-2">{tabs.map(([id,label])=><Button key={id} role="tab" id={`leaderboard-tab-${id}`} aria-controls="leaderboard-panel" tabIndex={period===id?0:-1} onKeyDown={tabKey} aria-selected={period===id} variant={period===id?"default":"outline"} onClick={()=>{setPeriod(id);setPage(0);}}>{label}</Button>)}</div><Button variant="outline" disabled={board.isFetching} onClick={()=>{void board.refetch();if(signedIn)void own.refetch();}}><RefreshCw className={`mr-2 size-4 ${board.isFetching?"animate-spin":""}`}/>Refresh</Button></div>
  <p className="text-sm text-muted-foreground">{period==="all"?"All recorded trainer XP awards.":period==="day"?"Today from midnight UTC.":period==="week"?"This week from Monday at midnight UTC.":"This month from the first day at midnight UTC."} Battle statistics use the same period. Updates may take up to a minute.</p>
  {signedIn&&(own.data?.own?<Position entry={own.data.own}/>:<p className="text-sm text-muted-foreground">{own.isError?"Your position is temporarily unavailable.":own.isPending?"Loading your position…":"You have no ranked activity in this period yet."}</p>)}
  {board.isError&&<p role="alert" className="rounded-lg border border-destructive/40 p-3">The leaderboard is temporarily unavailable.{data?" Showing the last successful results.":" Please try again."}</p>}
  {!showingCurrent&&data&&<p role="status" className="text-sm text-muted-foreground">{board.isError?"Last loaded period:":"Loading your selection; showing previous results:"} {tabs.find(t=>t[0]===data.period)?.[1]}</p>}
  <section role="tabpanel" id="leaderboard-panel" aria-labelledby={`leaderboard-tab-${period}`} aria-busy={board.isFetching} className="overflow-hidden rounded-2xl border bg-card">
   <div className="overflow-x-auto"><table className="w-full min-w-[920px] text-sm"><thead className="bg-primary/10"><tr>{["Rank","Trainer","Level",...(!allTime?["Lifetime XP"]:[]),"Battles","Wins","Losses","Win rate",allTime?"Lifetime XP":"Period XP"].map(label=><th key={label} scope="col" className={`whitespace-nowrap px-4 py-4 ${label==="Trainer"?"text-left":"text-right"}`}>{label}</th>)}</tr></thead><tbody>{data?.entries.map((row,index)=><tr key={`${row.rank}:${row.name}:${index}`} className={`border-t ${showingCurrent&&own.data?.ownRow===data.page*50+index+1?"bg-primary/10":"hover:bg-muted/40"}`}><td className="px-4 py-4 text-right font-bold"><span className="inline-flex items-center justify-end gap-2"><RankTrophy rank={row.rank}/>{n(row.rank)}</span></td><th scope="row" className="max-w-64 truncate px-4 py-4 text-left font-semibold" title={row.name}>{row.name}</th>{[row.level,...(!allTime?[n(row.lifetimeXp)]:[]),n(row.battles),n(row.wins),n(row.losses),row.winRate===null?"—":`${row.winRate}%`,n(row.periodXp)].map((value,i)=><td key={i} className={`whitespace-nowrap px-4 py-4 text-right tabular-nums ${i===(allTime?5:6)?"font-bold text-primary":""}`}>{value}</td>)}</tr>)}</tbody></table></div>
   {!data&&board.isPending&&<p role="status" className="p-8 text-center text-muted-foreground">Loading trainer rankings…</p>}
   {data?.entries.length===0&&<p className="p-8 text-center text-muted-foreground">{data.total===0?"No ranked activity in this period yet. Play a ranked battle to join the leaderboard.":"No trainers on this page."}</p>}
  </section>
  {data&&<div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground"><span>{data.periodStart?`From ${new Date(data.periodStart).toUTCString()} · `:""}Updated {new Date(data.calculatedAt).toUTCString()}</span><div className="flex items-center gap-3"><Button variant="outline" disabled={page===0||board.isFetching} onClick={()=>setPage(p=>p-1)}>Previous</Button><span>Page {page+1} of {Math.max(1,Math.ceil(data.total/50))}</span><Button variant="outline" disabled={(page+1)*50>=data.total||board.isFetching} onClick={()=>setPage(p=>p+1)}>Next</Button></div></div>}
 </main>;
}
