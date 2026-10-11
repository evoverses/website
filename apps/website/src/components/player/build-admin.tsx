"use client";
import { useEffect,useState } from 'react';
import { partSize,maximumSize,type Build } from '@/lib/downloads/core';
type Snapshot={builds:Omit<Build,'uploadId'>[];publishedId:string|null;more:boolean};
async function rpc(action:string,id?:string,body?:BodyInit,part?:number,signal?:AbortSignal){
 const query=new URLSearchParams({action,...(id?{id}:{}),...(part?{part:String(part)}:{})});
 for(let attempt=0;attempt<12;attempt++){
  const response=await fetch(`/api/downloads/admin?${query}`,{method:'POST',body,signal,headers:body instanceof Blob?{'Content-Type':'application/octet-stream'}:{'Content-Type':'application/json'}});
  if([429,503].includes(response.status)&&attempt<11){await new Promise(r=>setTimeout(r,5000));continue;}
  const value=await response.json();if(!response.ok)throw Error(({UNPUBLISH_FIRST:'Unpublish this build before deleting it.',BUILD_OPERATION_BUSY:'Another build operation is running. Please try again shortly.',PUBLICATION_CHANGED:'The published build changed. Refresh this page before trying again.'} as Record<string,string>)[value.error]||value.error||'Upload failed');return value;
 }throw Error('Please retry');
}
export function BuildAdmin(){
 const [snapshot,setSnapshot]=useState<Snapshot>(),[file,setFile]=useState<File|null>(null),[version,setVersion]=useState(''),[notes,setNotes]=useState(''),[status,setStatus]=useState(''),[busy,setBusy]=useState(false),[progress,setProgress]=useState(0);
 const [draft,setDraft]=useState<{id:string;filename:string;size:number;next:number}|null>(null);
 async function refresh(){const r=await fetch('/api/downloads/admin',{cache:'no-store'});if(!r.ok)throw Error('Could not load downloads');setSnapshot(await r.json());}
 useEffect(()=>{refresh().catch(e=>setStatus(e.message));},[]);
 async function upload(){if(!file)return;setBusy(true);setStatus('Uploading. Keep this tab open.');
 try{
  if(file.size>maximumSize)throw Error('Maximum file size is 5 GB');
  let upload=draft;
  if(!upload){upload={id:crypto.randomUUID(),filename:file.name,size:file.size,next:1};setDraft(upload);}
  await rpc('start',undefined,JSON.stringify({requestId:upload.id,version,notes,filename:file.name,size:file.size}));
  if(upload.filename!==file.name||upload.size!==file.size)throw Error('Select the original ZIP to retry this upload');
  for(let part=upload.next;part<=Math.ceil(file.size/partSize);part++){
   await rpc('part',upload.id,file.slice((part-1)*partSize,part*partSize),part);
   upload={...upload,next:part+1};setDraft(upload);setProgress(Math.min(100,Math.round(part*partSize/file.size*100)));
  }
  await rpc('complete',upload.id,JSON.stringify({}));setDraft(null);setFile(null);setStatus('Upload complete. Select Publish below to make it available.');await refresh();
 }catch(e){setStatus(`${e instanceof Error?e.message:'Upload failed'}. You can retry without restarting completed chunks.`);}finally{setBusy(false);}}
 async function publish(id:string){if(!snapshot||!window.confirm('Make this build the download for all approved beta players?'))return;setBusy(true);try{await rpc('publish',id,JSON.stringify({expectedPublishedId:snapshot.publishedId}));await refresh();setStatus('Build published.');}catch(e){setStatus(e instanceof Error?e.message:'Publish failed');}finally{setBusy(false);}}
 async function cancel(){if(!draft||!window.confirm('Discard the unfinished upload?'))return;setBusy(true);try{await rpc('abort',draft.id,JSON.stringify({}));setDraft(null);setProgress(0);setStatus('Upload cancelled.');await refresh();}catch{setStatus('Could not cancel. Please retry.');}finally{setBusy(false);}}

 async function unpublish(build:Snapshot['builds'][number]){
  if(!snapshot||!window.confirm(`Unpublish ${build.version}? Players will no longer be able to download this build. Its file stays stored and can be published again.`))return;
  setBusy(true);try{await rpc('unpublish',build.id,JSON.stringify({expectedPublishedId:snapshot.publishedId}));await refresh();setStatus('Build unpublished. Its file is retained.');}catch(e){setStatus(e instanceof Error?e.message:'Unpublish failed');}finally{setBusy(false);}
 }
 async function deleteBuild(build:Snapshot['builds'][number]){
  if(!window.confirm(`Permanently delete ${build.version} (${build.filename}) and its uploaded file? This cannot be undone.`))return;
  setBusy(true);try{await rpc('delete',build.id,JSON.stringify({confirmVersion:build.version}));if(draft?.id===build.id){setDraft(null);setProgress(0);}await refresh();setStatus('Build and uploaded file deleted.');}catch(e){setStatus(e instanceof Error?e.message:'Delete failed');}finally{setBusy(false);}
 }
 const field='block w-full rounded-lg border bg-background p-3';
 return <><section className="space-y-4 rounded-2xl border border-purple-400/30 p-6"><label className="block">Build version<input className={field} value={version} onChange={e=>setVersion(e.target.value)} maxLength={64} disabled={busy||!!draft} placeholder="Beta 0.1"/></label><label className="block">Release notes<textarea className={field} value={notes} onChange={e=>setNotes(e.target.value)} maxLength={2000} disabled={busy||!!draft}/></label><label className="block">Windows game ZIP (maximum 5 GB)<input className={field} type="file" accept=".zip" disabled={busy||!!draft} onChange={e=>setFile(e.target.files?.[0]||null)}/></label><button className="rounded-lg bg-purple-600 px-5 py-3 font-bold text-white disabled:opacity-40" disabled={busy||!file||!version} onClick={upload}>{busy?'Working…':draft?'Retry upload':'Upload build'}</button>{draft&&!busy&&<button className="ml-4 underline" onClick={cancel}>Cancel upload</button>}<progress className="w-full accent-purple-600" value={progress} max={100}/><p role="status" aria-live="polite">{status}</p><p className="text-sm opacity-70">Uploads are private until published. Keep this tab open; retries reuse completed chunks. Older builds remain stored and can be republished.</p></section><div className="overflow-x-auto"><table className="w-full text-left"><thead><tr>{['Version','Size','Uploaded','Status','Action'].map(x=><th className="whitespace-nowrap p-3" key={x}>{x}</th>)}</tr></thead><tbody>{snapshot?.builds.map(build=><tr key={build.id} className="border-t"><td className="p-3">{build.version}</td><td className="whitespace-nowrap p-3">{(build.size/1024**3).toFixed(2)} GB</td><td className="whitespace-nowrap p-3">{new Date(build.createdAt).toLocaleDateString()}</td><td className="whitespace-nowrap p-3">{snapshot.publishedId===build.id?'Published':build.deleted?'Deletion pending':build.aborted?'Cancelled':build.ready?'Ready':'Incomplete'}</td><td className="p-3"><div className="flex flex-nowrap gap-2 whitespace-nowrap"><button disabled={busy||!build.ready||build.aborted||build.deleted||snapshot.publishedId===build.id} className="rounded-lg border px-4 py-2 disabled:opacity-40" onClick={()=>publish(build.id)}>Publish</button>{!build.deleted&&(snapshot.publishedId===build.id||build.available)&&<button disabled={busy} className="rounded-lg border px-4 py-2 disabled:opacity-40" onClick={()=>unpublish(build)}>Unpublish</button>}<button disabled={busy||snapshot.publishedId===build.id} title={snapshot.publishedId===build.id?'Unpublish this build before deleting it':undefined} className="rounded-lg border border-red-500/40 px-4 py-2 text-red-500 disabled:opacity-40" onClick={()=>deleteBuild(build)}>Delete</button></div></td></tr>)}</tbody></table>{snapshot?.builds.length===0&&<p className="p-4">No builds uploaded yet.</p>}{snapshot?.more&&<p>More than 100 builds stored. Contact maintenance before uploading further versions.</p>}</div></>;
}
