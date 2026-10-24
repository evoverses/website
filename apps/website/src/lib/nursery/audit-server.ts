import { previousFujiNursery } from "./previous-fuji";
import 'server-only';
import { rememberVrfRequest } from './vrf-audit';
import { fujiWrapperAbi } from './test-wrapper';
import { createPublicClient, http, encodeFunctionData, erc20Abi, type Abi, type Hex } from 'viem';
import { nurseryChain, nurseryTokenAddress as evoContractAddress, nurseryBerthaAddress, nurseryHermannAddress, nurseryWrapperAddress, nurseryNetworkConfigured, nurseryTransactionsEnabled, usesChainlinkRandomness, nurseryRegistryVersion } from './network';
import berthaAbi from './abi/Breeder_Bertha.json';
import hermannAbi from './abi/Hatcher_Hermann.json';
import { AccessError, type Bucket } from '@/lib/downloads/server';
import { intentSchema, eventSchema, type Attempt, type AuditRecord, type Intent } from './audit-core';

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
const client = createPublicClient({ chain: nurseryChain, transport: http() });
const attemptKey = (id: string) => `nursery-audit/attempts/${id}.json`;
function contractAction(intent: Omit<Intent, 'kind'>, existingAttempt = false) {
  if (nurseryTransactionsEnabled === false) throw new AccessError(409, 'NURSERY_SIGNING_DISABLED');
  if (intent.action === 'fulfill' && usesChainlinkRandomness) throw new AccessError(400, 'INVALID_ACTION');
  const previous = existingAttempt ? previousFujiNursery(intent) : undefined;
  const bertha = previous?.bertha ?? nurseryBerthaAddress;
  const hermann = previous?.hermann ?? nurseryHermannAddress;
  if (!nurseryNetworkConfigured || !bertha || !hermann || !/^0x[\da-fA-F]{40}$/.test(bertha) || !/^0x[\da-fA-F]{40}$/.test(hermann)) throw new AccessError(409, 'NURSERY_NOT_CONFIGURED');
  const target = intent.action === 'fulfill' ? nurseryWrapperAddress : intent.action === 'approve' ? evoContractAddress : ['breed', 'completeBreed'].includes(intent.action) ? bertha : intent.action === 'withdrawNativeCredit' ? intent.target : hermann;
  if (!intent.target || !target || !same(target, intent.target)) throw new AccessError(400, 'INVALID_TARGET');
  if (intent.action === 'withdrawNativeCredit' && ![bertha, hermann].some(address => same(address, intent.target!))) throw new AccessError(400, 'INVALID_TARGET');
  if (intent.action === 'approve' && (!intent.args[0] || ![bertha, hermann].some(address => same(address, intent.args[0]!)))) throw new AccessError(400, 'INVALID_TARGET');
  const abi = intent.action === 'fulfill' ? fujiWrapperAbi : intent.action === 'approve' ? erc20Abi : same(target, bertha) ? berthaAbi as Abi : hermannAbi as Abi;
  try {
    const args = intent.args.map(value => value.startsWith('0x') ? value : BigInt(value));
    return { target, hermann, registryVersion: previous?.registryVersion ?? nurseryRegistryVersion, data: encodeFunctionData({ abi: abi as Abi, functionName: intent.action, args }) };
  } catch { throw new AccessError(400, 'INVALID_ACTION'); }
}
async function append(b: Bucket, attempt: Attempt, event: Partial<AuditRecord> & Pick<AuditRecord, 'phase' | 'source'>) {
  const recordedAt = new Date().toISOString(), eventId = crypto.randomUUID();
  const record: AuditRecord = { ...attempt, ...event, eventId, recordedAt };
  const saved = await b.put(`nursery-audit/events/${recordedAt.slice(0, 10)}/${recordedAt}-${eventId}.json`, JSON.stringify(record), { onlyIf: { etagDoesNotMatch: '*' } });
  if (!saved) throw new AccessError(503, 'AUDIT_UNAVAILABLE');
  // Structured, credential-free operational evidence is also emitted to Worker logs.
  console.info('nursery_action', { attemptId: attempt.attemptId, administratorId: attempt.administratorId, action: attempt.action, phase: record.phase, source: record.source, transactionHash: record.transactionHash });
  return record;
}
export async function writeNurseryAudit(b: Bucket, administratorId: string, raw: unknown) {
  const start = intentSchema.safeParse(raw);
  if (start.success) {
    if (start.data.chainId !== nurseryChain.id) throw new AccessError(400, 'INVALID_CHAIN');
    const intent = { action: start.data.action, wallet: start.data.wallet, target: start.data.target, args: start.data.args, value: start.data.value, chainId: start.data.chainId };
    if (!['recoverBreed', 'findEgg', 'preflight'].includes(intent.action)) contractAction(intent);
    const attempt: Attempt = { ...intent, attemptId: crypto.randomUUID(), administratorId, createdAt: new Date().toISOString() };
    if (!await b.put(attemptKey(attempt.attemptId), JSON.stringify(attempt), { onlyIf: { etagDoesNotMatch: '*' } })) throw new AccessError(503, 'AUDIT_UNAVAILABLE');
    await append(b, attempt, { phase: 'started', source: 'server_authorized' });
    return { attemptId: attempt.attemptId };
  }
  const input = eventSchema.safeParse(raw);
  if (!input.success) throw new AccessError(400, 'INVALID_REQUEST');
  const event = { attemptId: input.data.attemptId, phase: input.data.phase, transactionHash: input.data.transactionHash, errorCode: input.data.errorCode };
  const stored = await b.get(attemptKey(event.attemptId));
  if (!stored) throw new AccessError(404, 'ATTEMPT_NOT_FOUND');
  const attempt = await stored.json<Attempt>();
  if (attempt.chainId !== nurseryChain.id) throw new AccessError(409, 'INVALID_CHAIN');
  if (attempt.administratorId !== administratorId) throw new AccessError(403, 'ATTEMPT_OWNER_REQUIRED');
  if (['confirmed', 'reverted', 'submitted'].includes(event.phase) && !event.transactionHash) throw new AccessError(400, 'TRANSACTION_HASH_REQUIRED');
  let verified: Partial<AuditRecord> = {};
  if (event.phase === 'confirmed' || event.phase === 'reverted') {
    if (['recoverBreed', 'findEgg', 'preflight'].includes(attempt.action)) throw new AccessError(400, 'INVALID_ACTION');
    const expected = contractAction(attempt, true);
    const hash = event.transactionHash as Hex;
    const [tx, receipt] = await Promise.all([client.getTransaction({ hash }), client.getTransactionReceipt({ hash })]);
    if (!same(tx.from, attempt.wallet) || !tx.to || !same(tx.to, expected.target) || tx.input !== expected.data || tx.value !== BigInt(attempt.value) || receipt.transactionHash !== hash || (receipt.status === 'success') !== (event.phase === 'confirmed')) throw new AccessError(409, 'TRANSACTION_MISMATCH');
    const vrfRequestId = receipt.status === 'success' ? await rememberVrfRequest(b, attempt, receipt) : undefined;
    if (receipt.status === 'success' && ['treat', 'requestHatch', 'completeHatch'].includes(attempt.action)) {
      const kind = expected.registryVersion === 2 ? await client.readContract({ address: expected.hermann, abi: hermannAbi as Abi, functionName: 'eggKind', args: [BigInt(attempt.args[0]!)], blockNumber: receipt.blockNumber }) as number : 2;
      if (![1, 2].includes(kind)) throw new AccessError(409, 'EGG_KIND_UNAVAILABLE');
      verified.eggKind = kind === 1 ? 'genesis' : 'bred';
      verified.tokenId = attempt.args[0];
      if (kind === 1) verified.genesisSnapshotRoot = await client.readContract({ address: expected.hermann, abi: hermannAbi as Abi, functionName: 'genesisSnapshotRoot', blockNumber: receipt.blockNumber }) as Hex;
    }
    verified = { ...verified, vrfRequestId, source: 'chain_verified', blockNumber: receipt.blockNumber.toString(), blockHash: receipt.blockHash, gasUsed: receipt.gasUsed?.toString(), gasLimit: tx.gas.toString(), effectiveGasPrice: receipt.effectiveGasPrice?.toString() };
  }
  await append(b, attempt, { ...event, source: 'browser_reported', ...verified });
  return { recorded: true };
}
