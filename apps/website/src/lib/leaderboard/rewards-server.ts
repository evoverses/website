import "server-only";
import { getEpicConfig } from "@/lib/player/server";
import type { RewardsOperation } from "./rewards-handler";
export async function rewardsRpc(operation:RewardsOperation,input:unknown,token?:string){
 const config=getEpicConfig();if(!config?.hosted)throw Error("Rewards unavailable");
 const suffix=operation==="archive"?"":operation==="mine"?"/me":`/admin/${operation}`;
 const response=await fetch(`${config.apiUrl}/internal/leaderboard/rewards${suffix}`,{method:"POST",headers:{"content-type":"application/json","X-EvoVerses-Service":config.hosted.serviceToken,...(token?{authorization:`Bearer ${token}`}:{})},body:JSON.stringify(input),cache:"no-store",redirect:"manual",signal:AbortSignal.timeout(15000)});
 if(response.status>=300&&response.status<400)throw Error("Redirect refused");
 const reader=response.body?.getReader();if(!reader)throw Error("Rewards unavailable");const chunks:Uint8Array[]=[];let size=0;
 try{while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>1048576){await reader.cancel();throw Error("Rewards unavailable");}chunks.push(part.value);}}finally{reader.releaseLock();}
 return {status:response.status,value:JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(Buffer.concat(chunks))) as unknown};
}
