import Link from 'next/link';
import { AccessError,bucket,currentBuild,permission } from '@/lib/downloads/server';
export const dynamic='force-dynamic';
export const metadata={title:'Download EvoVerses',robots:{index:false,follow:false}};
export default async function DownloadPage(){
 let build=null,error='';try{await permission();build=await currentBuild(await bucket());}catch(e){error=e instanceof AccessError?e.code:'SERVICE_UNAVAILABLE';}
 return <main className="page mx-auto max-w-3xl px-6 py-16"><section className="rounded-3xl border border-purple-400/30 bg-purple-950/10 p-8 sm:p-12"><p className="text-sm font-bold uppercase tracking-widest text-purple-500">EvoVerses Beta</p><h1 className="my-4 text-4xl font-extrabold">Your adventure starts here</h1>
 {error==='SIGN_IN_REQUIRED'?<><p>Sign in with Epic to check your beta access.</p><Link className="mt-6 inline-block rounded-xl bg-purple-600 px-6 py-3 font-bold text-white" href="/signin">Sign in with Epic</Link></>:error==='BETA_APPROVAL_REQUIRED'?<p>Your account does not currently have beta access. An administrator must approve your account before you can download the game.</p>:error?<p>Downloads are temporarily unavailable. Please try again shortly.</p>:!build?<p>No build available yet. Your beta access is ready; check back when the first download is published.</p>:<><h2 className="text-xl font-bold">Windows · {build.version}</h2><p className="my-3 whitespace-pre-wrap">{build.notes}</p><p className="text-sm opacity-75">{(build.size/1024**3).toFixed(2)} GB · ZIP download</p><a className="my-6 inline-block rounded-xl bg-purple-600 px-6 py-3 font-bold text-white" href={`/api/downloads/file?id=${build.id}`}>Download for Windows</a><p>Extract the ZIP into a folder, open the game, then sign in with Epic using your approved beta account.</p></>}
 </section></main>;
}
