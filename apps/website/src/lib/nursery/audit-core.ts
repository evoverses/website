import { z } from 'zod';

export const nurseryAction = z.enum(['approve', 'breed', 'completeBreed', 'treat', 'requestHatch', 'completeHatch', 'withdrawNativeCredit', 'recoverBreed', 'findEgg', 'preflight', 'fulfill']);
export const auditPhase = z.enum(['started', 'wallet_requested', 'submitted', 'confirmed', 'reverted', 'failed', 'cancelled', 'confirmation_unknown', 'completed']);
const address = z.string().regex(/^0x[a-fA-F0-9]{40}$/);
export const intentSchema = z.object({
  kind: z.literal('start'), action: nurseryAction, wallet: address,
  target: address.optional(), args: z.array(z.string().regex(/^(?:[0-9]{1,78}|0x[a-fA-F0-9]{40}|0x[a-fA-F0-9]{64})$/)).max(3).default([]),
  value: z.string().regex(/^[0-9]{1,78}$/).default('0'), chainId: z.literal(43113),
}).strict();
export const eventSchema = z.object({
  kind: z.literal('event'), attemptId: z.string().uuid(), phase: auditPhase.exclude(['started']),
  transactionHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/).optional(),
  errorCode: z.enum(['WALLET_CANCELLED', 'SIMULATION_FAILED', 'TRANSACTION_REVERTED', 'RPC_UNAVAILABLE', 'ACTION_FAILED']).optional(),
}).strict();
export type Intent = z.infer<typeof intentSchema>;
export type AuditEvent = z.infer<typeof eventSchema>;
export type Attempt = Omit<Intent, 'kind'> & { attemptId: string; administratorId: string; createdAt: string };
export type AuditRecord = Attempt & { eventId: string; recordedAt: string; phase: z.infer<typeof auditPhase>; source: 'server_authorized' | 'browser_reported' | 'chain_verified'; transactionHash?: string; errorCode?: string; blockNumber?: string; blockHash?: string; gasUsed?: string; gasLimit?: string; eggKind?: "genesis" | "bred"; tokenId?: string; genesisSnapshotRoot?: string; effectiveGasPrice?: string; vrfRequestId?: string; vrfStatus?: string; requestTransactionHash?: string };

export function classifyNurseryError(error: unknown): 'WALLET_CANCELLED' | 'ACTION_FAILED' {
  // Never send arbitrary wallet/RPC error text, which can contain request headers or credentials.
  const e = error as { code?: number; message?: string } | null;
  return e?.code === 4001 || /user rejected|user denied|request rejected/i.test(e?.message ?? '') ? 'WALLET_CANCELLED' : 'ACTION_FAILED';
}
