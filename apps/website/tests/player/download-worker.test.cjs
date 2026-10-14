const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
class FixedLengthStream extends TransformStream {
 constructor(expected){let written=0;super({transform(chunk,controller){written+=chunk.length;if(written>expected)throw Error('too long');controller.enqueue(chunk);},flush(){if(written!==expected)throw Error('too short');}});}
}
function load(file,imports={}){const module={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module,exports:module.exports,require:n=>imports[n]??require(n),Response,Request,Headers,URL,Number,FixedLengthStream,console:{error(){}}});return module.exports;}
const core=load('src/lib/downloads/core.ts'),{createDownloadWorker}=load('src/lib/downloads/worker.ts',{'./core':core});
const id='11111111-1111-4111-8111-111111111111',url='https://beta.evoverses.com/api/downloads/file?id='+id;
function setup({status=200,range,bytes=8,body,metadata={},etag='"same"',objectSize=bytes}={}){
 let gets=0,cancelled=false,seen;
 const waits=[];
 const next={fetch:async request=>{seen=request;const headers={'Cache-Control':'private, no-store','Content-Type':'application/zip','Content-Disposition':'attachment; filename="EvoVerses.zip"','ETag':'"same"','X-EvoVerses-Download-Build':id,'X-EvoVerses-Download-Length':String(range?range.length:bytes),'X-EvoVerses-Download-Object-Size':String(bytes),...(range?{'Content-Range':`bytes ${range.offset}-${range.offset+range.length-1}/${bytes}`}:{}) ,...metadata};return new Response(null,{status,headers});}};
 const bucket={get:async(key,options)=>{gets++;assert.equal(key,'files/'+id+'.zip');if(range){assert.equal(options.range.offset,range.offset);assert.equal(options.range.length,range.length);}return {httpEtag:etag,size:objectSize,body:body??new ReadableStream({start(c){c.enqueue(new Uint8Array(range?range.length:bytes));c.close();},cancel(){cancelled=true;}})};}};
 const worker=createDownloadWorker(next),ctx={waitUntil:p=>waits.push(p)};
 return {fetch:r=>worker.fetch(r,{GAME_BUILDS:bucket},ctx),waits,gets:()=>gets,cancelled:()=>cancelled,seen:()=>seen};
}
test('other pages and methods retain the generated Next worker',async()=>{
 const requests=[];const worker=createDownloadWorker({fetch:async r=>{requests.push(r);return new Response('delegated');}});
 for(const r of [new Request('https://beta.evoverses.com/download'),new Request(url,{method:'POST'})])assert.equal(await(await worker.fetch(r,{},{})).text(),'delegated');
 assert.equal(requests.length,2);
});
test('failed approval, unpublished builds and invalid ranges cannot read storage',async()=>{
 for(const status of [401,403,404,416,503]){const s=setup({status});assert.equal((await s.fetch(new Request(url))).status,status);assert.equal(s.gets(),0);}
});
test('authorisation preserves cookie, pinned build, Range and If-Range and uses HEAD only',async()=>{
 const s=setup();const response=await s.fetch(new Request(url,{headers:{Cookie:'ev:player-session='+'a'.repeat(64),Range:'bytes=0-', 'If-Range':'"same"'}}));
 const head=s.seen();assert.equal(head.method,'HEAD');assert.equal(head.url,url);for(const [name,value]of Object.entries({Cookie:'ev:player-session='+'a'.repeat(64),Range:'bytes=0-','If-Range':'"same"'}))assert.equal(head.headers.get(name),value);
 assert.equal((await response.arrayBuffer()).byteLength,8);await Promise.all(s.waits);
});
test('full and resumed downloads enforce their byte count and retain private attachment headers',async()=>{
 for(const range of [undefined,{offset:2,length:4}]){
  const s=setup({status:range?206:200,range});const response=await s.fetch(new Request(url));
  assert.equal(response.status,range?206:200);assert.equal(response.headers.get('Content-Length'),String(range?4:8));
  assert.equal(response.headers.get('Cache-Control'),'private, no-store');assert.equal(response.headers.get('Content-Disposition'),'attachment; filename="EvoVerses.zip"');
  assert.equal(response.headers.has('X-EvoVerses-Download-Build'),false);
  if(range)assert.equal(response.headers.get('Content-Range'),'bytes 2-5/8');
  assert.equal((await response.arrayBuffer()).byteLength,range?4:8);await Promise.all(s.waits);
 }
});
test('HEAD declares the full byte count without opening the ZIP stream',async()=>{
 const s=setup({bytes:1701615119});const response=await s.fetch(new Request(url,{method:'HEAD'}));
 assert.equal(response.headers.get('Content-Length'),'1701615119');assert.equal(s.gets(),0);assert.equal(s.waits.length,0);assert.equal(response.body,null);
});
test('malformed authorised metadata fails closed before storage',async()=>{
 for(const metadata of [{'X-EvoVerses-Download-Build':''},{'X-EvoVerses-Download-Length':'0'},{'X-EvoVerses-Download-Length':'9'},{'ETag':''}]){
  const s=setup({metadata});assert.equal((await s.fetch(new Request(url))).status,503);assert.equal(s.gets(),0);
 }
 const s=setup({status:206,range:{offset:2,length:4},metadata:{'Content-Range':'bytes 2-5/9'}});assert.equal((await s.fetch(new Request(url))).status,503);assert.equal(s.gets(),0);
});
test('file replacement between authorisation and streaming is rejected',async()=>{
 for(const values of [{etag:'"changed"'},{objectSize:9}]){const s=setup(values);assert.equal((await s.fetch(new Request(url))).status,503);assert.equal(s.cancelled(),true);}
});
test('short and oversized streams fail instead of completing an incomplete ZIP',async()=>{
 for(const actual of [4,12]){
  const s=setup({body:new Blob([new Uint8Array(actual)]).stream()});const response=await s.fetch(new Request(url));
  await assert.rejects(response.arrayBuffer());await Promise.all(s.waits);
 }
});
test('512 MiB transfer stays bounded by the consumer and completes past the previous cutoff',async()=>{
 const size=512*1024*1024,chunk=new Uint8Array(64*1024);let produced=0;
 const body=new ReadableStream({pull(c){if(produced===size){c.close();return;}produced+=chunk.length;c.enqueue(chunk);}});
 const s=setup({bytes:size,body});const response=await s.fetch(new Request(url));
 await new Promise(r=>setTimeout(r,25));assert.ok(produced<=chunk.length*4,'producer waits for the consumer');
 let received=0;for await(const part of response.body)received+=part.length;
 assert.equal(received,size);await Promise.all(s.waits);
});
