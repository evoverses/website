import { AccessError, bucket, permission } from '@/lib/downloads/server';
import { privateHeaders } from '@/lib/downloads/core';
import { getPlayerWebOrigin } from '@/lib/player/server';
import { writeNurseryAudit } from '@/lib/nursery/audit-server';
import type { AuditRecord } from '@/lib/nursery/audit-core';
export const dynamic = 'force-dynamic';
const reply = (data: unknown, status = 200) => Response.json(data, { status, headers: privateHeaders() });
function failure(error: unknown) {
  if (error instanceof AccessError) { console.warn("nursery_audit_denied", { traceId: crypto.randomUUID(), code: error.code, status: error.status }); return reply({ error: error.code }, error.status); }
  if (error instanceof SyntaxError) return reply({ error: 'INVALID_REQUEST' }, 400);
  console.error('Nursery audit request failed', { code: 'AUDIT_UNAVAILABLE' });
  return reply({ error: 'AUDIT_UNAVAILABLE' }, 503);
}
async function boundedJson(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new AccessError(400, 'INVALID_REQUEST');
  let text = '', size = 0; const decoder = new TextDecoder('utf-8', { fatal: true });
  try { while (true) { const chunk = await reader.read(); if (chunk.done) break; size += chunk.value.byteLength;
    if (size > 4096) { await reader.cancel(); throw new AccessError(413, 'REQUEST_TOO_LARGE'); }
    text += decoder.decode(chunk.value, { stream: true });
  } } finally { reader.releaseLock(); }
  return JSON.parse(text + decoder.decode());
}
export async function POST(request: Request) {
  try {
    if (request.headers.get('origin') !== getPlayerWebOrigin() || new URL(request.url).origin !== getPlayerWebOrigin()) throw new AccessError(403, 'ORIGIN_NOT_ALLOWED');
    const administratorId = await permission(true, true);
    return reply(await writeNurseryAudit(await bucket(), administratorId, await boundedJson(request)));
  } catch (error) { return failure(error); }
}
export async function GET(request: Request) {
  try {
    await permission(true, true);
    const url = new URL(request.url), date = url.searchParams.get('date') ?? new Date().toISOString().slice(0, 10), cursor = url.searchParams.get('cursor') ?? undefined;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || (cursor?.length ?? 0) > 2048) throw new AccessError(400, 'INVALID_REQUEST');
    const b = await bucket(), list = await b.list({ prefix: `nursery-audit/events/${date}/`, limit: 100, cursor });
    const events: AuditRecord[] = [];
    for (const object of list.objects) { const record = await b.get(object.key); if (record) events.push(await record.json<AuditRecord>()); }
    return reply({ events, cursor: list.truncated ? list.cursor : null });
  } catch (error) { return failure(error); }
}
