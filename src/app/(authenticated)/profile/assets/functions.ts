import { auth } from "@/auth";

import { getAccountCookie } from "@/lib/cookies/account.server";
import { getAccountInfo } from "@/lib/playfab/client";
import { Address } from "thirdweb";

export const getWallet = async () => {
  let wallet: Address | undefined;
  const session: any = await auth();
  if (session) {
    const data = await getAccountInfo(session.playFab.PlayFabId, session.playFab.SessionTicket);
    if (data.CustomIdInfo?.CustomId) {
      wallet = data.CustomIdInfo.CustomId as Address;
    }
  }
  if (!wallet) {
    const { address, connected } = await getAccountCookie();
    if (connected) {
      wallet = address;
    }
  }
  return wallet;
};
