"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { ProEntryPanel } from "./pro-entry-panel";
import { proBoardSchema } from "@/lib/leaderboard/pro-core";
export function ProLeaderboard({signedIn=false}:{signedIn?:boolean}){
 const [month,setMonth]=useState(()=>new Date().toISOString().slice(0,7)),[page,setPage]=useState(0);
 const query=useQuery({queryKey:['pro-leaderboard',month,page],queryFn:async()=>{const response=await fetch(`/api/leaderboard/pro?month=${month}&page=${page}`,{cache:'no-store',credentials:'omit'});if(!response.ok)throw Error('Leaderboard unavailable');return proBoardSchema.parse(await response.json());},staleTime:60000,retry:1});
 return <section className="space-y-4 rounded-2xl border bg-card p-5"><div className="flex flex-wrap justify-between gap-3"><div><h2 className="text-2xl font-bold">Monthly Pro leaderboard</h2><p className="mt-2 text-sm text-muted-foreground">Ranked matchmaking wins with an all-NFT team count for enrolled players.</p></div><label className="space-y-1">Month (UTC)<Input aria-label="Pro leaderboard month" type="month" value={month} onChange={e=>{if(/^20\d{2}-(0[1-9]|1[0-2])$/.test(e.target.value)){setMonth(e.target.value);setPage(0);}}}/></label></div>
 <ProEntryPanel month={month} signedIn={signedIn}/><p className="rounded-lg border bg-primary/10 p-3 font-semibold">EVO prize pool: {query.data?.pool===null?'Not set':query.data?.pool??'Loading…'}{query.data?.pool!==null&&query.data?.pool?' EVO':''}</p>
 <div className="rounded-xl border bg-primary/5 p-4"><h3 className="font-bold">Monthly Pro rules</h3><ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed">
 <li><strong>Your score:</strong> wins in ranked matchmaking with an entirely NFT starting team. Mixed teams do not count. Win/loss ratio breaks ties.</li>
 <li><strong>To qualify for a prize:</strong> pay the monthly EVO entry fee and complete at least 10 all-NFT ranked matches, with at least one win. Your account must be active and, during beta, approved for testing.</li>
 <li><strong>The period:</strong> each calendar month, from midnight UTC on the first day to midnight UTC on the first day of the next month. Scores start fresh each month.</li>
 <li><strong>The prizes:</strong> 80% of confirmed entry fees plus any administrator-funded bonus forms the pool. The other 20% of entry fees is commission. The top three qualifying places receive 50%, 30% and 20%. A high rank alone does not qualify you if you have not met the battle requirement.</li>
 <li><strong>Ties:</strong> tied players split the prizes for the places they occupy. For example, two players tied for first share first and second prize: 40% each. Third place receives 20%. Unfilled prize places are not paid out.</li>
 <li><strong>Payment:</strong> after the month ends, an admin checks and confirms the winners, then pays EVO manually to each winner’s first linked wallet. Link a wallet before the winners are confirmed; changing it later does not change that month’s confirmed payment address.</li>
 <li><strong>Separate rewards:</strong> this EVO pool is additional to the normal leaderboard’s item prizes. Friendly battles and PvBot do not count. Entry opens seven days before the month and closes at 00:00 UTC on day 8. Timely entry counts eligible matches throughout the month.</li>
 </ul></div>
 {query.isError&&<p role="alert">Pro rankings temporarily unavailable. <Button variant="outline" onClick={()=>void query.refetch()}>Retry</Button></p>}
 <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-sm"><thead><tr>{['Rank','Trainer','Level','Battles','Losses','Win/loss ratio','Wins'].map(h=><th key={h} scope="col" className={`p-3 ${h==='Trainer'?'text-left':'text-right'}`}>{h}</th>)}</tr></thead><tbody>{query.data?.entries.map((r,i)=><tr key={`${r.rank}:${i}`} className="border-t"><td className="p-3 text-right"><span className="inline-flex items-center gap-2">{r.rank<=3&&<Trophy aria-label={['Gold','Silver','Bronze'][r.rank-1]+' trophy'} className={`size-4 ${['text-yellow-400','text-slate-300','text-amber-600'][r.rank-1]}`}/>} {r.rank}</span></td><th scope="row" className="p-3 text-left">{r.name}</th>{[r.level,r.battles,r.losses,r.losses?(r.wins/r.losses).toFixed(2):r.wins?"Unbeaten":"—",r.wins].map((v,j)=><td key={j} className={`p-3 text-right tabular-nums ${j===4?'font-bold text-primary':''}`}>{v.toLocaleString()}</td>)}</tr>)}</tbody></table></div>
 {query.isPending&&<p>Loading Pro rankings…</p>}{query.data?.entries.length===0&&<p>No enrolled players have qualifying all-NFT ranked results for this month.</p>}
 <div className="flex items-center justify-end gap-3"><Button variant="outline" disabled={page===0||query.isFetching} onClick={()=>setPage(p=>p-1)}>Previous</Button><span>Page {page+1}</span><Button variant="outline" disabled={!query.data||(page+1)*50>=query.data.total||query.isFetching} onClick={()=>setPage(p=>p+1)}>Next</Button></div></section>;
}
