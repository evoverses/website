"use client";
import { useRef,useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createThirdwebClient,getContract,sendTransaction } from "thirdweb";
import { transfer } from "thirdweb/extensions/erc20";
import { avalanche } from "thirdweb/chains";
import { formatUnits } from "viem";
import { useChainWallet } from "@/hooks/use-chain-wallet";
import { clientId } from "@/lib/thirdweb/env.client";
import { proEntryStatus,proEntryIntent,proEntryVerified } from "@/lib/leaderboard/pro-core";
import { Button } from "@workspace/ui/components/button";
const client=createThirdwebClient({clientId});
async function rpc(operation:'status'|'intent'|'verify',input:unknown){const r=await fetch('/api/leaderboard/pro/entry',{method:'POST',headers:{'content-type':'application/json'},credentials:'same-origin',cache:'no-store',body:JSON.stringify({operation,input}),signal:AbortSignal.timeout(20000)});const v=await r.json();if(!r.ok)throw Error(v.error?.code??'ENTRY_UNAVAILABLE');return v;}
export function ProEntryPanel({month,signedIn}:{month:string;signedIn:boolean}){
 const {account,wallet}=useChainWallet(),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[recoveryHash,setRecoveryHash]=useState(''),flight=useRef(false);
 const query=useQuery({queryKey:['pro-entry',month,account?.address],enabled:signedIn,meta:{private:true},gcTime:0,retry:false,queryFn:async()=>proEntryStatus.parse(await rpc('status',{month}))});
 async function pay(){const data=query.data;if(!data||!account||!wallet||flight.current)return;flight.current=true;setBusy(true);setMessage('');
 try{let intentId=data.intentId;let hash=recoveryHash.trim();if(intentId&&!hash)hash=localStorage.getItem(`pro-entry:${intentId}`)??'';if(!hash){intentId=proEntryIntent.parse(await rpc('intent',{month,address:account.address})).intentId;}if(!intentId)throw Error('ENTRY_UNAVAILABLE');const storageKey=`pro-entry:${intentId}`;
 if(!hash){if(!window.confirm(`Enter ${month} Pro league for ${formatUnits(BigInt(data.feeUnits!),18)} EVO? Only all-NFT ranked teams count. 20% of entry fees is commission. Gas is additional.`))return;
 await wallet.switchChain(avalanche);const tx=transfer({contract:getContract({client,chain:avalanche,address:data.token}),to:data.treasury,amount:formatUnits(BigInt(data.feeUnits!),18)});const sent=await sendTransaction({account,transaction:tx});hash=sent.transactionHash;setRecoveryHash(hash);try{localStorage.setItem(storageKey,hash);}catch{setMessage('Keep the transaction hash shown below to retry verification.');}}
 setMessage('Payment submitted. Checking confirmed entry…');proEntryVerified.parse(await rpc('verify',{intentId,transactionHash:hash}));try{localStorage.removeItem(storageKey);}catch{}setRecoveryHash('');setMessage('Entry confirmed. Your qualifying matches for the whole month count.');await query.refetch();
 }catch(e){setMessage(`Entry is not yet confirmed: ${(e as Error).message}. If you submitted a payment, retry verification with its transaction hash. Do not send another payment.`);}finally{flight.current=false;setBusy(false);}}
 const data=query.data,now=Date.now(),within=data&&now>=Date.parse(data.opensAt)&&now<Date.parse(data.closesAt);
 return <section className="rounded-xl border bg-primary/5 p-4 space-y-3"><h3 className="font-bold">Monthly Pro entry</h3>{!signedIn?<p>Sign in with Epic to enter.</p>:query.isError?<p role="alert">Entry unavailable. Approved beta account required. <Button variant="outline" onClick={()=>void query.refetch()}>Refresh</Button></p>:<><p>{data?.enrolled?'Your entry is confirmed.':data?.cancelled?'This competition is cancelled.':data?.feeUnits?`Entry fee: ${formatUnits(BigInt(data.feeUnits),18)} EVO.`:'Entry fee not published.'}</p>{data&&<p className="text-sm">Registration: {new Date(data.opensAt).toUTCString()} to {new Date(data.closesAt).toUTCString()}.</p>}{data&&!data.enabled&&<p>Entry payments are on standby while beta checks are completed.</p>}<Button disabled={busy||!data?.enabled||data.enrolled||data.cancelled||!data.feeUnits||(!within&&!data.intentId)||!account} onClick={()=>void pay()}>{busy?'Checking…':'Pay entry / retry verification'}</Button>{data?.intentId&&!data.enrolled&&<label className="block text-sm">Submitted transaction hash (for recovery or late verification)<input className="block w-full min-w-0 rounded border bg-background p-2" value={recoveryHash} onChange={e=>setRecoveryHash(e.target.value)} placeholder="0x…"/></label>}{!account&&<p className="text-sm">Connect and link your wallet through Profile to pay.</p>}</>}{message&&<p role="status">{message}</p>}</section>;
}
