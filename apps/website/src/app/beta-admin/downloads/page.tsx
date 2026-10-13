import Link from 'next/link';
import { permission } from '@/lib/downloads/server';
import { BuildAdmin } from '@/components/player/build-admin';
export const dynamic='force-dynamic';
export const metadata={title:'Game build administration',robots:{index:false,follow:false}};
export default async function Page(){try{await permission(true,true);}catch{return <main className="page p-10"><h1 className="text-3xl font-bold">Unauthorised</h1><p>A master administrator account is required.</p></main>;}
 return <main className="page mx-auto max-w-5xl space-y-6 p-6"><Link href="/beta-admin">← Account administration</Link><h1 className="text-3xl font-bold">Game downloads</h1><p>Upload a Windows ZIP, then publish it when ready. Only approved beta players can download it.</p><BuildAdmin/></main>;
}
