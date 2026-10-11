import { AccessError,bucket,currentBuild,fileKey,permission,recordKey } from '@/lib/downloads/server';
import { byteRange,privateHeaders,buildIdPattern } from '@/lib/downloads/core';
export const dynamic='force-dynamic';
async function serve(request:Request,head=false){
 try{
  await permission();const b=await bucket(),current=await currentBuild(b);
  const id=new URL(request.url).searchParams.get('id');
  if(id&&!buildIdPattern.test(id))throw new AccessError(400,'INVALID_BUILD');
  let build=current;
  if(id&&id!==current?.id){if(!(await b.head(`released/${id}.json`)))throw new AccessError(404,'BUILD_NOT_FOUND');const record=await b.get(recordKey(id));build=record?await record.json<NonNullable<typeof current>>():null;}
  if(!build)return Response.json({error:'NO_BUILD_AVAILABLE'},{status:404,headers:privateHeaders()});
  const metadata=await b.head(fileKey(build.id));if(!metadata)throw new AccessError(503,'FILE_UNAVAILABLE');
  const headers=privateHeaders();headers.set('Accept-Ranges','bytes');headers.set('Content-Type','application/zip');headers.set('Content-Disposition',`attachment; filename="${build.filename}"`);headers.set('ETag',metadata.httpEtag);
  let range;
  try{range=byteRange(request.headers.get('if-range')&&request.headers.get('if-range')!==metadata.httpEtag?null:request.headers.get('range'),metadata.size);}catch{headers.set('Content-Range',`bytes */${metadata.size}`);return new Response(null,{status:416,headers});}
  headers.set('Content-Length',String(range?.length??metadata.size));
  if(range)headers.set('Content-Range',`bytes ${range.offset}-${range.offset+range.length-1}/${metadata.size}`);
  if(head)return new Response(null,{status:range?206:200,headers});
  const object=await b.get(fileKey(build.id),range?{range}:undefined);if(!object)throw new AccessError(503,'FILE_UNAVAILABLE');
  return new Response(object.body,{status:range?206:200,headers});
 }catch(e){return Response.json({error:e instanceof AccessError?e.code:'SERVICE_UNAVAILABLE'},{status:e instanceof AccessError?e.status:503,headers:privateHeaders()});}
}
export const GET=(request:Request)=>serve(request);
export const HEAD=(request:Request)=>serve(request,true);
