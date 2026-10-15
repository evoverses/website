import Link from 'next/link';
import { permission } from '@/lib/downloads/server';
import { NurseryAudit } from '@/components/player/nursery-audit';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Nursery test history', robots: { index: false, follow: false } };
export default async function Page() {
  try { await permission(true, true); } catch { return <main className="page p-10"><h1 className="text-3xl font-bold">Unauthorised</h1><p>A master administrator account is required.</p></main>; }
  return <main className="page mx-auto max-w-7xl space-y-6 p-6"><Link href="/beta-admin">← Account administration</Link><h1 className="text-3xl font-bold">Nursery test history</h1><NurseryAudit /></main>;
}
