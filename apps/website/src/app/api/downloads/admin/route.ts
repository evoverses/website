import { AccessError,bucket,permission,recordKey,fileKey,withBuildLease } from '@/lib/downloads/server';
import { buildIdPattern,expectedPart,partSize,privateHeaders,validateBuild,type Build } from '@/lib/downloads/core';
import { getPlayerWebOrigin } from '@/lib/player/server';
export const dynamic='force-dynamic';
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:privateHeaders()});
async function json(request:Request){const text=await bounded(request,4096);return JSON.parse(new TextDecoder().decode(text));}
async function bounded(request:Request,limit:number){
 if(Number(request.headers.get('content-length')||0)>limit)throw new AccessError(413,'UPLOAD_TOO_LARGE');
 const reader=request.body?.getReader();if(!reader)throw new AccessError(400,'INVALID_REQUEST');
 const chunks:Uint8Array[]=[];let size=0;
 try{while(true){const c=await reader.read();if(c.done)break;size+=c.value.length;if(size>limit){await reader.cancel();throw new AccessError(413,'UPLOAD_TOO_LARGE');}chunks.push(c.value);}}finally{reader.releaseLock();}
 const result=new Uint8Array(size);let offset=0;for(const c of chunks){result.set(c,offset);offset+=c.length;}return result.buffer;
}
export async function GET(){try{
 await permission(true);const b=await bucket();
 const list=await b.list({prefix:'records/',limit:100});
 const builds=[];for(const item of list.objects){const record=await b.get(item.key);if(record){const {uploadId:_,...build}=await record.json<Build>();if(!build.deleted||!(await b.head(`deletions/${build.id}.json`))){build.available=!!(await b.head(`released/${build.id}.json`));builds.push(build);}}}
 const pointer=await b.get('published.json');const published=pointer?await pointer.json<{id:string}>():null;
 return reply({builds:builds.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)),publishedId:published?.id||null,more:list.truncated,partSize});
 }catch(e){return failure(e);}}
export async function POST(request:Request){try{
 if(request.headers.get('origin')!==getPlayerWebOrigin()||new URL(request.url).origin!==getPlayerWebOrigin())throw new AccessError(403,'ORIGIN_NOT_ALLOWED');
 const administratorId=await permission(true),b=await bucket();
 const url=new URL(request.url),action=url.searchParams.get('action');
 if(action==='start'){
  const raw=await json(request),id=raw.requestId;
  if(typeof id!=='string'||!buildIdPattern.test(id))throw new AccessError(400,'INVALID_REQUEST');
  const {requestId:_,...values}=raw,input=validateBuild(values);
  const prior=await b.get(recordKey(id));if(prior){const old=await prior.json<Build>();if(old.administratorId!==administratorId||old.version!==input.version||old.filename!==input.filename||old.size!==input.size||old.notes!==input.notes||old.aborted||old.deleted)throw new AccessError(409,'RETRY_CONFLICT');return reply({id,partSize});}
  const upload=await b.createMultipartUpload(fileKey(id));
  const build:Build={...input,id,administratorId,uploadId:upload.uploadId,createdAt:new Date().toISOString()};
  try{await b.put(recordKey(id),JSON.stringify(build));}catch(e){await b.resumeMultipartUpload(fileKey(id),upload.uploadId).abort();throw e;}
  return reply({id,partSize});
 }
 const id=url.searchParams.get('id')||'';if(!buildIdPattern.test(id))throw new AccessError(400,'INVALID_BUILD');
 const perform=async()=>{
 const stored=await b.get(recordKey(id));if(!stored)throw new AccessError(404,'BUILD_NOT_FOUND');
 const build=await stored.json<Build>();
 if(build.deleted&&action!=='delete')throw new AccessError(404,'BUILD_NOT_FOUND');
 if(action==='unpublish'){
  const input=await json(request),prior=await b.get('published.json'),old=prior?await prior.json<{id:string|null}>():null;
  if((old?.id||null)!==input.expectedPublishedId){if(!old?.id&&!(await b.head(`released/${id}.json`)))return reply({unpublished:true});throw new AccessError(409,'PUBLICATION_CHANGED');}
  // Remove the stable URL entitlement too: unpublishing must withdraw old links.
  await b.delete(`released/${id}.json`);
  if(old?.id===id){const saved=await b.put('published.json',JSON.stringify({id:null,administratorId,unpublishedAt:new Date().toISOString()}),{onlyIf:{etagMatches:prior!.etag}});if(!saved)throw new AccessError(409,'PUBLICATION_CHANGED');}
  await b.put(`publication-history/${crypto.randomUUID()}.json`,JSON.stringify({action:'unpublish',id,administratorId,createdAt:new Date().toISOString()}));
  return reply({unpublished:true});
 }
 if(action==='delete'){
  const input=await json(request);if(input.confirmVersion!==build.version)throw new AccessError(400,'DELETE_CONFIRMATION_REQUIRED');
  if(await b.head(`deletions/${id}.json`))return reply({deleted:true});
  const pointer=await b.get('published.json');if(pointer&&(await pointer.json<{id:string|null}>()).id===id)throw new AccessError(409,'UNPUBLISH_FIRST');
  // Retain a tombstone so late uploads/retries cannot resurrect a deleted build.
  if(!build.deleted)await b.put(recordKey(id),JSON.stringify({...build,deleted:true,deletedAt:new Date().toISOString(),deletedBy:administratorId}));
  if(!build.ready&&!build.aborted){try{await b.resumeMultipartUpload(fileKey(id),build.uploadId).abort();}catch(e){if(!(await b.head(fileKey(id)))&&!(e instanceof Error&&/does not exist|NoSuchUpload|already aborted/i.test(e.message)))throw new AccessError(503,'DELETE_INCOMPLETE');}}
  const keys=[fileKey(id),`released/${id}.json`];for(let n=1;n<=Math.ceil(build.size/partSize);n++)keys.push(`parts/${id}/${String(n).padStart(4,'0')}.json`);
  await b.delete(keys);
  await b.put(`deletions/${id}.json`,JSON.stringify({id,administratorId,completedAt:new Date().toISOString()}));
  await b.put(`publication-history/${crypto.randomUUID()}.json`,JSON.stringify({action:'delete',id,administratorId,createdAt:new Date().toISOString()}));
  return reply({deleted:true});
 }
 if(build.aborted)throw new AccessError(409,'UPLOAD_ABORTED');
 if(action==='publish'){
  if(!build.ready||!(await b.head(fileKey(id))))throw new AccessError(409,'UPLOAD_INCOMPLETE');
  const input=await json(request);if(typeof input.expectedPublishedId!=='string'&&input.expectedPublishedId!==null)throw new AccessError(400,'INVALID_REQUEST');
  const prior=await b.get('published.json');const old=prior?await prior.json<{id:string}>():null;
  if((old?.id||null)!==input.expectedPublishedId)throw new AccessError(409,'PUBLICATION_CHANGED');
  const saved=await b.put('published.json',JSON.stringify({id,publishedAt:new Date().toISOString(),administratorId}),{onlyIf:prior?{etagMatches:prior.etag}:{etagDoesNotMatch:'*'}});
  if(!saved)throw new AccessError(409,'PUBLICATION_CHANGED');await b.put(`released/${id}.json`,JSON.stringify({id}));await b.put(`publication-history/${crypto.randomUUID()}.json`,JSON.stringify({id,previousId:old?.id||null,administratorId,publishedAt:new Date().toISOString()}));return reply({publishedId:id});
 }
 // Only the uploader can continue/abort their draft. No browser-supplied object keys or R2 upload IDs.
 if(build.administratorId!==administratorId)throw new AccessError(403,'UPLOAD_OWNER_REQUIRED');
 if(action==='complete'&&build.ready)return reply({ready:true});
 if(build.ready)throw new AccessError(409,'BUILD_ALREADY_COMPLETE');
 const upload=b.resumeMultipartUpload(fileKey(id),build.uploadId);
 if(action==='part'){
  const n=Number(url.searchParams.get('part')),size=expectedPart(build.size,n);
  const data=await bounded(request,size);if(data.byteLength!==size)throw new AccessError(400,'INVALID_PART_SIZE');
  if(n===1){const bytes=new Uint8Array(data);if(bytes[0]!==0x50||bytes[1]!==0x4b||![[3,4],[5,6],[7,8]].some(p=>bytes[2]===p[0]&&bytes[3]===p[1]))throw new AccessError(400,'ZIP_REQUIRED');}
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data))).map(x=>x.toString(16).padStart(2,'0')).join('');
  const key=`parts/${id}/${String(n).padStart(4,'0')}.json`,old=await b.get(key);
  if(old){const prior=await old.json<{digest:string}>();if(prior.digest!==digest)throw new AccessError(409,'PART_CHANGED');return reply({part:n});}
  const receipt=await upload.uploadPart(n,data);await b.put(key,JSON.stringify({...receipt,digest}));return reply({part:n});
 }
 if(action==='complete'){
  const parts=[];for(let n=1;n<=Math.ceil(build.size/partSize);n++){const p=await b.get(`parts/${id}/${String(n).padStart(4,'0')}.json`);if(!p)throw new AccessError(409,'UPLOAD_INCOMPLETE');const {partNumber,etag}=await p.json<{partNumber:number;etag:string}>();parts.push({partNumber,etag});}
  // A completion retry may arrive after R2 assembled the file but before metadata was saved.
  let file=await b.head(fileKey(id));if(!file)file=await upload.complete(parts);
  if(file.size!==build.size)throw new AccessError(409,'FILE_SIZE_MISMATCH');
  await b.put(recordKey(id),JSON.stringify({...build,ready:true}));return reply({ready:true});
 }
 if(action==='abort'){await upload.abort();await b.put(recordKey(id),JSON.stringify({...build,aborted:true}));return reply({aborted:true});}
 throw new AccessError(400,'INVALID_REQUEST');
 };
 return ['publish','unpublish','delete','complete','abort'].includes(action||'')?await withBuildLease(b,perform):await perform();
 }catch(e){return failure(e);}}
function failure(e:unknown){if(e instanceof AccessError)return reply({error:e.code},e.status);if(e instanceof SyntaxError||e instanceof Error&&['INVALID_BUILD','INVALID_PART'].includes(e.message))return reply({error:'INVALID_REQUEST'},400);return reply({error:'SERVICE_UNAVAILABLE'},503);}
