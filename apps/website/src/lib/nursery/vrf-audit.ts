import 'server-only';
import { createPublicClient, http, decodeEventLog, parseAbi, type TransactionReceipt, type Address } from 'viem';
import { nurseryChain, nurseryBerthaAddress, nurseryHermannAddress, nurseryWrapperAddress, usesChainlinkRandomness } from './network';
import { AccessError, type Bucket } from '@/lib/downloads/server';
import type { Attempt, AuditRecord } from './audit-core';

const client = createPublicClient({ chain: nurseryChain, transport: http() });
const abi = parseAbi([
  'event RandomnessRequested(uint256 indexed requestId,address indexed payer,uint256 vrfCost,bool subsidised)',
  'event RandomnessReady(uint256 indexed requestId,uint256 word)',
  'event WrapperFulfillmentFailed(uint256 indexed requestId,address indexed consumer)',
]);
type Reference = { attempt: Attempt; requestId: string; contract: Address; requestTransactionHash: string; blockNumber: string; blockHash: string; scanBlock: string };
const key = (contract: string, id: string) => `nursery-audit/${nurseryChain.id === 43113 ? "" : `${nurseryChain.id}/`}vrf/${contract.toLowerCase()}/${id}.json`;
const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

// Called only after the original user transaction has been verified against its immutable audit intent.
export async function rememberVrfRequest(b: Bucket, attempt: Attempt, receipt: TransactionReceipt) {
  if (!usesChainlinkRandomness || !['breed', 'requestHatch'].includes(attempt.action)) return undefined;
  for (const log of receipt.logs ?? []) {
    if (!attempt.target || !same(log.address, attempt.target)) continue;
    let decoded;
    try { decoded = decodeEventLog({ abi, ...log }); } catch { continue; }
    if (decoded.eventName !== 'RandomnessRequested') continue;
    const { requestId, payer } = decoded.args;
    if (!same(payer, attempt.wallet)) throw new AccessError(409, 'VRF_REQUEST_MISMATCH');
    const ref: Reference = { attempt, requestId: String(requestId), contract: log.address, requestTransactionHash: receipt.transactionHash, blockNumber: String(receipt.blockNumber), blockHash: receipt.blockHash, scanBlock: String(receipt.blockNumber) };
    const storageKey = key(log.address, String(requestId));
    const saved = await b.put(storageKey, JSON.stringify(ref), { onlyIf: { etagDoesNotMatch: '*' } });
    if (!saved) {
      const prior = await b.get(storageKey);
      if (!prior || (await prior.json<Reference>()).requestTransactionHash !== ref.requestTransactionHash) throw new AccessError(503, 'VRF_AUDIT_UNAVAILABLE');
    }
    return String(requestId);
  }
  throw new AccessError(409, 'VRF_REQUEST_MISSING');
}

// Bounded reconciliation of canonical Chainlink events. This never sends a transaction or chooses a seed.
export async function reconcileVrf(b: Bucket, keeper: 'bertha' | 'hermann', requestId: string) {
  if (!usesChainlinkRandomness) throw new AccessError(409, 'CHAINLINK_NOT_CONFIGURED');
  const contract = keeper === 'bertha' ? nurseryBerthaAddress : nurseryHermannAddress;
  const storageKey = key(contract, requestId), stored = await b.get(storageKey);
  if (!stored) throw new AccessError(409, 'VRF_AUDIT_PENDING');
  const ref = await stored.json<Reference>();
  if (ref.attempt.chainId !== nurseryChain.id) throw new AccessError(409, 'INVALID_CHAIN');
  const outcomeKey = `nursery-audit/${nurseryChain.id === 43113 ? "" : `${nurseryChain.id}/`}vrf-outcomes/${contract.toLowerCase()}/${requestId}.json`;
  const prior = await b.get(outcomeKey);
  if (prior) return prior.json<{ status: string; transactionHash: string }>();
  const block = await client.getBlock({ blockNumber: BigInt(ref.blockNumber) });
  if (block.hash !== ref.blockHash) throw new AccessError(409, 'VRF_REQUEST_REORG');
  const latest = await client.getBlockNumber({ cacheTime: 0 });
  const fromBlock = BigInt(ref.scanBlock), toBlock = latest < fromBlock + 99n ? latest : fromBlock + 99n;
  if (fromBlock > latest) return { status: 'pending' };
  const [ready, failed] = await Promise.all([
    client.getContractEvents({ address: contract, abi, eventName: 'RandomnessReady', args: { requestId: BigInt(requestId) }, fromBlock, toBlock, strict: true }),
    client.getContractEvents({ address: nurseryWrapperAddress, abi, eventName: 'WrapperFulfillmentFailed', args: { requestId: BigInt(requestId), consumer: contract }, fromBlock, toBlock, strict: true }),
  ]);
  const event = ready[0] ?? failed[0];
  if (!event) {
    // Conditional progress avoids a slower tab overwriting a newer scan checkpoint.
    await b.put(storageKey, JSON.stringify({ ...ref, scanBlock: String(toBlock + 1n) }), { onlyIf: { etagMatches: stored.etag } });
    return { status: 'pending' };
  }
  const receipt = await client.getTransactionReceipt({ hash: event.transactionHash });
  if (receipt.status !== 'success' || receipt.blockHash !== event.blockHash || !receipt.logs.some(log => same(log.address, event.address) && log.logIndex === event.logIndex && log.data === event.data && log.topics.join() === event.topics.join())) throw new AccessError(409, 'VRF_CALLBACK_MISMATCH');
  const status = ready.length ? 'fulfilled' : 'callback_failed';
  const outcome = { status, transactionHash: receipt.transactionHash };
  const recordedAt = new Date().toISOString();
  const record: AuditRecord = { ...ref.attempt, eventId: `vrf-${contract}-${requestId}`, recordedAt, phase: status === 'fulfilled' ? 'completed' : 'failed', source: 'chain_verified', transactionHash: receipt.transactionHash, vrfRequestId: requestId, vrfStatus: status, requestTransactionHash: ref.requestTransactionHash, blockNumber: String(receipt.blockNumber), blockHash: receipt.blockHash, gasUsed: String(receipt.gasUsed), effectiveGasPrice: String(receipt.effectiveGasPrice) };
  // Date comes from the canonical callback block so retries use the same immutable key.
  const callbackBlock = await client.getBlock({ blockNumber: receipt.blockNumber });
  if (callbackBlock.hash !== receipt.blockHash) throw new AccessError(409, 'VRF_CALLBACK_REORG');
  const date = new Date(Number(callbackBlock.timestamp) * 1000).toISOString().slice(0, 10);
  const eventKey = `nursery-audit/events/${date}/${record.eventId}.json`;
  if (!await b.put(eventKey, JSON.stringify(record), { onlyIf: { etagDoesNotMatch: '*' } }) && !await b.head(eventKey)) throw new AccessError(503, 'VRF_AUDIT_UNAVAILABLE');
  await b.put(outcomeKey, JSON.stringify(outcome), { onlyIf: { etagDoesNotMatch: '*' } });
  return outcome;
}
