import type { Metadata } from "next";
import { cookies } from "next/headers";
import { BetaAdmin } from "@/components/player/beta-admin";
import { playerSessionCookie } from "@/lib/player/auth-core";
import { betaAdminSnapshotSchema } from "@/lib/player/beta-admin-handler";
import { betaAdminRpc } from "@/lib/player/beta-admin-server";
import { playerLoginEnabled } from "@/lib/player/server";
export const metadata: Metadata = { title: "Beta administration", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function BetaAdminPage() {
  const token = (await cookies()).get(playerSessionCookie)?.value;
  if (!playerLoginEnabled || !token || !/^[a-f0-9]{64}$/.test(token)) return <main className="page p-10"><h1 className="text-3xl font-bold">Unauthorised</h1><p className="mt-3">An administrator account is required.</p></main>;
  try {
    const response = await betaAdminRpc("list", token, {});
    if ([401, 403].includes(response.status)) return <main className="page p-10"><h1 className="text-3xl font-bold">Unauthorised</h1><p className="mt-3">An administrator account is required.</p></main>;
    if (response.status !== 200) throw Error("Unavailable");
    const initialSnapshot = betaAdminSnapshotSchema.parse(response.value);
    return <main className="page mx-auto max-w-7xl space-y-6 px-4 py-10"><h1 className="text-3xl font-extrabold">Account administration</h1><BetaAdmin initialSnapshot={initialSnapshot} /></main>;
  } catch { return <main className="page p-10"><h1 className="text-3xl font-bold">Administration unavailable</h1><p className="mt-3">Please try again. No account changes were made.</p></main>; }
}
