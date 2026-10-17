import { getPlayerAccount } from "@/lib/player/server";
import { ProgressionLeaderboard } from "../progression-leaderboard";

export const dynamic = "force-dynamic";
export const metadata = {title: "PvBot Leaderboard | EvoVerses", description: "Remote ranked PvBot wins and lifetime earned Trainer XP."};
export default async function LeaderboardPage() {
  const account = await getPlayerAccount().catch(() => null);
  return <ProgressionLeaderboard key="pvbot" board="pvbot" viewerId={account?.player.id ?? null}/>;
}
