import Link from "next/link";
import { permission } from "@/lib/downloads/server";
import { LeaderboardRewardsAdmin } from "@/components/player/leaderboard-rewards-admin";
import { ProPrizesAdmin } from "@/components/player/pro-prizes-admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Leaderboard administration", robots: { index: false, follow: false } };

export default async function LeaderboardAdminPage() {
  try { await permission(true); }
  catch { return <main className="page p-10"><h1 className="text-3xl font-bold">Unauthorised</h1><p className="mt-3">An administrator account is required.</p></main>; }
  let master=false;
  try { await permission(true,true); master=true; } catch {}
  return <main className="page mx-auto max-w-7xl space-y-6 px-4 py-10">
    <Link className="inline-block rounded-lg border px-4 py-2" href="/beta-admin">← Account administration</Link>
    <h1 className="text-3xl font-extrabold">Leaderboard administration</h1>
    <LeaderboardRewardsAdmin />
    {master && <ProPrizesAdmin />}
  </main>;
}
