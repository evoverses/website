import 'server-only';
import { cookies } from 'next/headers';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { playerSessionCookie } from '@/lib/player/auth-core';
import { betaAdminRpc } from '@/lib/player/beta-admin-server';
import { getEpicConfig, playerLoginEnabled } from '@/lib/player/server';
import type { Build } from './core';
export class AccessError extends Error { constructor(public status:number,public code:string){super(code);} }
export async function permission(admin=false) {
 const token=(await cookies()).get(playerSessionCookie)?.value;
 if(!playerLoginEnabled||!token||!/^[a-f0-9]{64}$/.test(token))throw new AccessError(401,'SIGN_IN_REQUIRED');
 if(admin) {
  const result=await betaAdminRpc('list',token,{});
  if(result.status!==200)throw new AccessError([401,403,429].includes(result.status)?result.status:503,result.status===403?'ADMIN_REQUIRED':'SERVICE_UNAVAILABLE');
  const id=(result.value as {administratorId?:string}).administratorId;
  if(!id||!/^[-a-f0-9]{36}$/.test(id))throw new AccessError(503,'SERVICE_UNAVAILABLE');
  return id;
 }
 const config=getEpicConfig();if(!config)throw new AccessError(503,'SERVICE_UNAVAILABLE');
 const result=await fetch(`${config.apiUrl}/v1/game/access`,{headers:{Authorization:`Bearer ${token}`,...(config.hosted?{'X-EvoVerses-Service':config.hosted.serviceToken}:{})},cache:'no-store',redirect:'manual',signal:AbortSignal.timeout(8000)});
 if(result.status!==200)throw new AccessError([401,403,429].includes(result.status)?result.status:503,result.status===403?'BETA_APPROVAL_REQUIRED':'SERVICE_UNAVAILABLE');
 const v=await result.json() as {approved?:boolean;playerId?:string};
 if(v.approved!==true||!v.playerId)throw new AccessError(503,'SERVICE_UNAVAILABLE');
 return v.playerId;
}
// A narrow structural interface avoids depending on global Worker types in Next.js.
export type ObjectInfo={size:number;etag:string;httpEtag:string};
export type StoredObject=ObjectInfo & {body:ReadableStream<Uint8Array>;json:<T>()=>Promise<T>};
export type Bucket={delete:(key:string|string[])=>Promise<void>;get:(key:string,options?:{range:{offset:number;length:number}})=>Promise<StoredObject|null>;head:(key:string)=>Promise<ObjectInfo|null>;put:(key:string,value:string|ArrayBuffer,options?:{onlyIf:{etagMatches?:string;etagDoesNotMatch?:string}})=>Promise<ObjectInfo|null>;list:(options:{prefix:string;limit:number;cursor?:string})=>Promise<{objects:{key:string}[];truncated:boolean;cursor?:string}>;createMultipartUpload:(key:string)=>Promise<{uploadId:string}>;resumeMultipartUpload:(key:string,id:string)=>{uploadPart:(part:number,data:ArrayBuffer)=>Promise<{partNumber:number;etag:string}>;complete:(parts:{partNumber:number;etag:string}[])=>Promise<ObjectInfo>;abort:()=>Promise<void>}};
export async function bucket():Promise<Bucket> {
 const context=await getCloudflareContext({async:true});
 const b=(context.env as unknown as {GAME_BUILDS?:Bucket}).GAME_BUILDS;
 if(!b)throw new AccessError(503,'STORAGE_UNAVAILABLE');return b;
}
export const recordKey=(id:string)=>`records/${id}.json`;
export const fileKey=(id:string)=>`files/${id}.zip`;
export async function currentBuild(b:Bucket):Promise<Build|null>{
 const pointer=await b.get('published.json');if(!pointer)return null;
 const p=await pointer.json<{id:string|null}>();
 if(!p.id||!(await b.head(`released/${p.id}.json`)))return null;
 const record=await b.get(recordKey(p.id));if(!record)return null;
 const build=await record.json<Build>();return build.ready&&!build.deleted?build:null;
}

// R2 has no transaction spanning the release pointer and file objects. Serialise
// lifecycle changes with a conditional lease; a crashed request expires safely.
export async function withBuildLease<T>(b:Bucket,operation:()=>Promise<T>):Promise<T> {
 const key='build-lifecycle-lease.json',prior=await b.get(key),now=Date.now();
 if(prior&&(await prior.json<{expiresAt:number}>()).expiresAt>now)throw new AccessError(409,'BUILD_OPERATION_BUSY');
 const lease=await b.put(key,JSON.stringify({expiresAt:now+120000,owner:crypto.randomUUID()}),{onlyIf:prior?{etagMatches:prior.etag}:{etagDoesNotMatch:'*'}});
 if(!lease)throw new AccessError(409,'BUILD_OPERATION_BUSY');
 const claimedAt=Date.now();
 try{return await operation();}finally{
  // R2 allows one write per second to an object: space claim/release writes.
  await new Promise(resolve=>setTimeout(resolve,Math.max(0,1100-(Date.now()-claimedAt))));
  await b.put(key,JSON.stringify({expiresAt:0}),{onlyIf:{etagMatches:lease.etag}});}
}
