import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Button } from "@workspace/ui/components/button";
import { epicPendingCookie } from "@/lib/player/auth-core";
import { getEpicConfig, getPlayerAccount, playerWebAuth } from "@/lib/player/server";

export const metadata: Metadata = { title: "Sign In", referrer: "same-origin" };
const messages: Record<string, string> = {
  SIGNED_OUT: "You’ve signed out of EvoVerses. Epic may still be signed in on this browser; you can change accounts on Epic’s sign-in screen.",
  SIGNIN_UNAVAILABLE: "Sign-in is temporarily unavailable. Please try again soon.",
  SIGNIN_EXPIRED: "That sign-in attempt has expired. Please start again.",
  SIGNIN_BUSY: "Sign-in is busy. Please wait a moment and try again.",
  EPIC_CANCELLED: "Epic sign-in was cancelled. You can try again when you’re ready.",
  EPIC_VERIFICATION_FAILED: "We couldn’t verify that Epic sign-in. Please try again.",
  SERVICE_UNAVAILABLE: "We couldn’t reach your game account. Please try again. If this happened during sign-out, this browser is signed out but the server session may remain active until it expires.",
  INVALID_SESSION: "Your sign-in has expired. Please sign in again.",
};
export default async function SignInPage({ searchParams }: { searchParams: Promise<{ status?: string; confirm?: string }> }) {
  if (await getPlayerAccount()) redirect("/profile");
  const params = await searchParams;
  const ready = !!getEpicConfig();
  const confirmation = params.confirm === "1" && await playerWebAuth().hasPendingAsync((await cookies()).get(epicPendingCookie)?.value);
  const message = typeof params.status === "string" ? messages[params.status] : undefined;
  return (
    <main className="relative isolate grid min-h-[calc(100svh-4rem)] items-center gap-10 px-5 py-12 sm:px-10 lg:grid-cols-2 lg:px-20">
      <Image src="/signin/arena.png" alt="The EvoVerses battle arena" fill priority sizes="100vw" className="-z-20 object-cover object-center" />
      <div className="absolute inset-0 -z-10 bg-linear-to-r from-slate-950/75 via-slate-950/30 to-slate-950/65" />
      <div className="mx-auto max-w-xl space-y-5 text-white lg:mx-0">
        <p className="text-sm font-bold uppercase tracking-widest text-white/80">Welcome to EvoVerses</p>
        <h1 className="text-4xl font-black leading-tight sm:text-5xl">Your next battle starts here.</h1>
        <p className="max-w-md text-lg leading-relaxed text-white/85">One account for your game progress and Evoros. Sign in with the Epic account you use in the game.</p>
      </div>
      <section className="mx-auto w-full max-w-md rounded-3xl border bg-card/95 p-7 shadow-2xl backdrop-blur-sm sm:p-9" aria-labelledby="signin-heading">
        <h2 id="signin-heading" className="text-2xl font-extrabold">{confirmation ? "Create your EvoVerses account" : "Sign in to EvoVerses"}</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{confirmation ? "This Epic account doesn’t have an EvoVerses player yet. Create one to use on the website and in the game." : "Use the same Epic account here and in the game to see the same player, Evoros balance and inventory."}</p>
        {message && <p role="status" className="mt-5 rounded-xl border bg-muted/60 p-4 text-sm leading-relaxed">{message}</p>}
        {params.confirm === "1" && !confirmation && <p role="status" className="mt-5 text-sm">The account confirmation expired. Please sign in again.</p>}
        {confirmation ? (
          <form action="/api/player/auth/epic/confirm" method="post" className="mt-6"><Button type="submit" className="h-12 w-full rounded-xl font-bold">Create account</Button></form>
        ) : (
          <form action="/api/player/auth/epic/start" method="post" className="mt-6"><Button type="submit" disabled={!ready} className="h-12 w-full rounded-xl font-bold">Sign in with Epic</Button></form>
        )}
        {!ready && <p className="mt-3 text-sm text-muted-foreground">Sign-in is temporarily unavailable. Please try again soon.</p>}
        <p className="mt-5 text-xs leading-relaxed text-muted-foreground">{confirmation ? "Your account starts with an empty inventory. Creating it does not make a purchase." : "Your password stays with Epic."}</p>
        <Button variant="ghost" asChild className="mt-4 w-full"><Link href="/store">Browse the Store</Link></Button>
      </section>
    </main>
  );
}
