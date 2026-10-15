"use client";
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import type { AuditRecord } from '@/lib/nursery/audit-core';
import { nurseryChain } from '@/lib/nursery/network';

export function NurseryAudit() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [cursor, setCursor] = useState<string>();
  const history = useQuery({ queryKey: ['nursery-audit', date, cursor], retry: false, queryFn: async () => {
    const query = new URLSearchParams({ date }); if (cursor) query.set('cursor', cursor);
    const response = await fetch(`/api/nursery/audit?${query}`, { cache: 'no-store', redirect: 'error' });
    if (!response.ok) throw new Error('Nursery history is unavailable or access has expired.');
    return response.json() as Promise<{ events: AuditRecord[]; cursor: string | null }>;
  } });
  return <section className="space-y-4">
    <p>Times and dates below use UTC. Each attempt links the signed-in master administrator, wallet, action and transaction. Browser reports are labelled separately from outcomes verified on Fuji.</p>
    <div className="flex flex-wrap gap-3"><label>Date (UTC)<Input type="date" value={date} onChange={event => { setDate(event.target.value); setCursor(undefined); }} /></label><Button onClick={() => void history.refetch()} disabled={history.isFetching}>Refresh</Button>{cursor && <Button variant="outline" onClick={() => setCursor(undefined)}>First page</Button>}</div>
    {history.isLoading && <p role="status">Loading action history…</p>}
    {history.isError && <p role="alert">Nursery history is unavailable or access has expired.</p>}
    {history.data && <><p>{history.data.events.length} events on this page. An attempt without a final verified outcome needs reconciliation before repeating the transaction.</p><div className="overflow-x-auto"><table className="w-full text-sm"><caption className="sr-only">Nursery action history</caption><thead><tr>{['UTC time', 'Administrator / wallet', 'Action / outcome', 'Trace / transaction'].map(title => <th key={title} className="p-3 text-left">{title}</th>)}</tr></thead><tbody>{history.data.events.map(event => <tr key={event.eventId} className="border-t"><td className="p-3 whitespace-nowrap">{event.recordedAt}</td><td className="p-3 break-all">{event.administratorId}<br />{event.wallet}</td><td className="p-3">{event.action} · {event.phase}<br />{event.source}{event.errorCode && <><br />{event.errorCode}</>}<br />{event.eggKind && <>{event.eggKind === "genesis" ? "OG Genesis egg" : "Bred egg"} #{event.tokenId}<br /></>}Arguments: {event.args.join(', ')}<br />Value: {event.value} wei{event.gasLimit && <><br />Gas used / limit: {event.gasUsed} / {event.gasLimit}</>}{event.vrfRequestId && <><br />VRF request: {event.vrfRequestId}<br />{event.vrfStatus}</>}</td><td className="p-3 break-all">{event.attemptId}{event.transactionHash && <><br /><a className="underline" href={`${nurseryChain.blockExplorers.default.url}/tx/${event.transactionHash}`} target="_blank" rel="noreferrer">View Fuji transaction</a></>}</td></tr>)}</tbody></table></div>{history.data.cursor && <Button onClick={() => setCursor(history.data!.cursor!)}>Next page</Button>}</>}
  </section>;
}
