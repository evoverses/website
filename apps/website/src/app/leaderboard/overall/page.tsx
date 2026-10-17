import { getPlayerAccount } from "@/lib/player/server";
import { ProgressionLeaderboard } from "../progression-leaderboard";

export const dynamic = "force-dynamic";
export const metadata = {title: "Overall Trainer Leaderboard | EvoVerses", description: "Combined qualifying PvP and remote ranked PvBot earned Trainer XP."};
export default async function LeaderboardPage() {
  const account = await getPlayerAccount().catch(() => null);
  return <ProgressionLeaderboard key="overall" board="overall" viewerId={account?.player.id ?? null}/>;
}
