import { auth } from "@/auth";
import { getAccountCookie } from "@/lib/cookies/account";
import { getAccountInfo } from "@/lib/playfab";
import { Address } from "abitype";

export const getWallet = async () => {
  let wallet = "";
  const session: any = await auth();
  if (session) {
    const data = await getAccountInfo(session.playFab.PlayFabId, session.playFab.SessionTicket);
    wallet = data.CustomIdInfo?.CustomId as Address || "" as Address;
  }
  if (!wallet) {
    const { address, loggedIn } = getAccountCookie();
    if (loggedIn) {
      wallet = address;
    }
  }
  return wallet as Address;
};
