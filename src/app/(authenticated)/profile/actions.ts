"use server";
import { auth, signIn } from "@/auth";
import { Provider } from "@/types/auth";

export const linkAccount = async (provider: Provider) => {
  const session = await auth();
  console.log(session);
  if (session !== null) {
    switch (provider) {
      case "twitch":
        await signIn(provider, { testData: "test" }, { testData: "test" });
      // await linkTwitch(session.playFab.SessionTicket, session.account.access_token);
    }
  }

};
