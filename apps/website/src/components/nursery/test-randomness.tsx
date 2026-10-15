"use client";
import { useQuery } from '@tanstack/react-query';
import { Button } from '@workspace/ui/components/button';
import { useNurseryWallet } from './hooks';
import { nurseryChain, nurseryWrapperAddress, usesChainlinkRandomness } from '@/lib/nursery/network';
import { nurseryClient, sendNurseryTransaction } from '@/lib/nursery/contracts';
import { fujiWrapperAbi } from '@/lib/nursery/test-wrapper';
import { ErrorMessage } from './shared';

export function TestRandomness(props: { requestId: bigint; keeper: 'bertha' | 'hermann'; fulfilled?: boolean; refreshed: () => Promise<unknown> }) {
  return usesChainlinkRandomness ? <ChainlinkRandomness {...props} /> : props.fulfilled ? null : <ManualRandomness {...props} />;
}
function ChainlinkRandomness({ requestId, keeper }: { requestId: bigint; keeper: 'bertha' | 'hermann' }) {
  const w = useNurseryWallet();
  const trace = useQuery({ queryKey: ['nursery-vrf-trace', nurseryWrapperAddress, keeper, String(requestId)], enabled: w.canAct, refetchInterval: query => ['fulfilled', 'callback_failed'].includes(query.state.data?.status ?? '') ? false : 10_000,
    queryFn: async () => {
      const response = await fetch(`/api/nursery/randomness?keeper=${keeper}&id=${requestId}`, { method: 'POST', cache: 'no-store', redirect: 'error' });
      if (!response.ok) throw Error('Chainlink audit check is unavailable. The on-chain request remains active.');
      return response.json() as Promise<{ status: string; transactionHash?: string }>;
    } });
  return <div className="space-y-2 text-xs text-muted-foreground">
    {trace.isError && <p role="status">Status check delayed. We’ll keep checking.</p>}
    {trace.data?.status === 'callback_failed' && <p role="alert">We couldn’t prepare your {keeper === 'bertha' ? 'egg' : 'Evo'}. Check your activity before trying again.</p>}
    <details>
      <summary className="cursor-pointer w-fit">Request details</summary>
      <p className="mt-2 break-all">Request ID: {String(requestId)}</p>
      {trace.data?.transactionHash && <a className="inline-block mt-2 text-primary underline" href={`${nurseryChain.blockExplorers.default.url}/tx/${trace.data.transactionHash}`} target="_blank" rel="noreferrer">View result transaction</a>}
    </details>
  </div>;
}
function ManualRandomness({ requestId, refreshed }: { requestId: bigint; refreshed: () => Promise<unknown> }) {
  const w = useNurseryWallet();
  const administrator = useQuery({ queryKey: ['fuji-oracle-administrator', nurseryWrapperAddress], enabled: w.canAct && !!w.account,
    queryFn: () => nurseryClient.readContract({ address: nurseryWrapperAddress, abi: fujiWrapperAbi, functionName: 'administrator' }) });
  const canFulfill = w.canAct && administrator.data?.toLowerCase() === w.account?.address.toLowerCase();
  const fulfill = () => w.run(async () => {
    if (!w.account || !canFulfill) return;
    await w.guard();
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    const word = BigInt('0x' + Array.from(bytes, b => b.toString(16).padStart(2, '0')).join(''));
    await sendNurseryTransaction(w.account, nurseryWrapperAddress, fujiWrapperAbi, 'fulfill', [requestId, word], { beforeSend: w.guard });
    await refreshed();
  });
  return <div className="space-y-2"><p className="text-xs text-muted-foreground">Fuji test oracle: the deployment wallet supplies a test result. This does not use Chainlink VRF.</p><Button variant="outline" disabled={!canFulfill || w.busy} onClick={fulfill}>Supply test randomness</Button><ErrorMessage message={w.error} /></div>;
}
