import { bucket } from '@/lib/downloads/server';
export const dynamic='force-dynamic';
export const metadata={title:'Download Evoverses Beta Launcher',robots:{index:false,follow:false}};
export default async function DownloadPage(){
 let release:string|null=null,size=0,error=false;
 try{const object=await (await bucket()).get('launcher/published.json');if(object){const value=await object.json<{release:string;installer:{size:number}}>();if(/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(value.release)&&Number.isSafeInteger(value.installer.size)){release=value.release;size=value.installer.size;}}}catch{error=true;}
 return <main className="page mx-auto max-w-3xl px-6 py-16"><section className="rounded-3xl border border-purple-400/30 bg-purple-950/10 p-8 sm:p-12"><p className="text-sm font-bold uppercase tracking-widest text-purple-500">EvoVerses</p><h1 className="my-4 text-4xl font-extrabold">Evoverses Beta Launcher</h1>
 {error?<p>Downloads are temporarily unavailable. Please try again shortly.</p>:!release?<p>The Windows installer will be available shortly. Please check back soon.</p>:<><h2 className="text-xl font-bold">Windows installer</h2><p className="my-3">Install once. The launcher checks for updates when you open it and downloads only the files that changed.</p><p className="text-sm opacity-75">{(size/1024**3).toFixed(2)} GB · EXE installer · Windows 10 or 11, 64-bit</p><a className="my-6 inline-block rounded-xl bg-purple-600 px-6 py-3 font-bold text-white" href="/api/launcher/setup">Download Evoverses Beta Launcher</a><p>Run the installer, then open Evoverses Beta Launcher from your Start menu or desktop. Sign in with Epic Games to play.</p><p className="mt-4 text-sm opacity-75">This release has no verified Windows publisher signature. Windows may show a security warning or block it.</p></>}
 </section></main>;
}
