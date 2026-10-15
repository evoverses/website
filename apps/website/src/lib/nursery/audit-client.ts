import { classifyNurseryError, type Intent, type AuditEvent } from './audit-core';

const pendingKey = 'evo-nursery:audit-pending:v1';
async function post(value: unknown) {
  const response = await fetch('/api/nursery/audit', {
    method: 'POST', credentials: 'same-origin', redirect: 'error', cache: 'no-store',
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value),
  });
  const body = await response.json();
  if (!response.ok) throw new Error('Nursery logging is unavailable. No new wallet request can start.');
  return body;
}
export async function startNurseryAudit(intent: Omit<Intent, 'kind' | 'chainId'>) {
  return (await post({ ...intent, kind: 'start', chainId: 43113 })).attemptId as string;
}
function queued(): AuditEvent[] {
  try { const data = JSON.parse(localStorage.getItem(pendingKey) ?? '[]'); return Array.isArray(data) ? data.slice(-100) : []; } catch { return []; }
}
export async function recordNurseryEvent(event: Omit<AuditEvent, 'kind'>, required = false) {
  const value: AuditEvent = { ...event, kind: 'event' };
  try { await post(value); } catch (error) {
    // The server already holds the intent. Keep the hash/outcome for reconciliation after a reload.
    try { localStorage.setItem(pendingKey, JSON.stringify([...queued(), value].slice(-100))); } catch { /* The intent remains durable even if browser storage is full. */ }
    console.error('Nursery audit delivery pending', { attemptId: event.attemptId, phase: event.phase, transactionHash: event.transactionHash });
    if (required) throw error;
  }
}
export async function retryNurseryAudit() {
  const events = queued();
  for (const event of events) {
    try { await post(event); } catch { return; }
    try {
      // Preserve events added by another action while this delivery was in flight.
      const current = queued(), index = current.findIndex(item => JSON.stringify(item) === JSON.stringify(event));
      if (index >= 0) current.splice(index, 1);
      localStorage.setItem(pendingKey, JSON.stringify(current));
    } catch { return; }
  }
}
export async function auditNurseryFailure(attemptId: string, error: unknown, transactionHash?: string) {
  const errorCode = classifyNurseryError(error);
  await recordNurseryEvent({ attemptId, phase: transactionHash ? 'confirmation_unknown' : errorCode === 'WALLET_CANCELLED' ? 'cancelled' : 'failed', errorCode, transactionHash });
}

// Dependency injection exercises the actual signing/audit order without a funded wallet.
export async function runAuditedTransaction<T extends { status: string }>(
  intent: Omit<Intent, 'kind' | 'chainId'>,
  operations: { simulate: () => Promise<void>; guard: () => Promise<void>; send: () => Promise<string>; submitted?: (hash: string) => void; wait: (hash: string) => Promise<T> },
) {
  const attemptId = await startNurseryAudit(intent);
  let hash: string | undefined, terminal = false, stage = "simulation";
  try {
    await operations.simulate();
    stage = "guard";
    await operations.guard();
    await recordNurseryEvent({ attemptId, phase: 'wallet_requested' }, true);
    stage = 'wallet';
    hash = await operations.send();
    // Save the hash before receipt polling or any remote log write can fail.
    operations.submitted?.(hash);
    await recordNurseryEvent({ attemptId, phase: 'submitted', transactionHash: hash });
    stage = 'confirmation';
    const receipt = await operations.wait(hash);
    terminal = true;
    await recordNurseryEvent({ attemptId, phase: receipt.status === 'success' ? 'confirmed' : 'reverted', transactionHash: hash });
    if (receipt.status !== 'success') throw new Error(`The transaction reverted. Reference: ${attemptId}`);
    return receipt;
  } catch (error) {
    if (!terminal) {
      if (stage === 'simulation') await recordNurseryEvent({ attemptId, phase: 'failed', errorCode: 'SIMULATION_FAILED' });
      else await auditNurseryFailure(attemptId, error, hash);
    }
    if (hash && !terminal) throw new Error(`Confirmation is pending. Check transaction ${hash} before retrying. Reference: ${attemptId}`);
    throw error;
  }
}
