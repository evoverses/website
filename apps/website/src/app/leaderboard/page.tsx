import { cookies } from "next/headers";
import { playerSessionCookie } from "@/lib/player/auth-core";
import { TrainerLeaderboard } from "./trainer-leaderboard";
export const metadata={title:"Trainer Leaderboard | EvoVerses",description:"Trainer rankings by XP earned in ranked battles."};
export default async function LeaderboardPage(){
 const signedIn=Boolean((await cookies()).get(playerSessionCookie)?.value);
 return <TrainerLeaderboard signedIn={signedIn}/>;
}
