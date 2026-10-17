import Link from "next/link";

export function LeaderboardNavigation({active}: {active: "pvp" | "pvbot" | "overall"}) {
  return <nav aria-label="Leaderboard boards" className="flex flex-wrap gap-2">
    {([
      ["pvp", "/leaderboard", "PvP"],
      ["pvbot", "/leaderboard/pvbot", "PvBot"],
      ["overall", "/leaderboard/overall", "Overall"],
    ] as const).map(([board, href, text]) => <Link key={board} href={href} aria-current={active === board ? "page" : undefined}
      className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${active === board ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}>{text}</Link>)}
  </nav>;
}
