import "server-only";
import authConfig from "@/auth.config";
import { setAccountCookieSessionTicket } from "@/lib/cookies/account";
import { getPlayFabIDFromSocialLoginID, linkSocialAuth, loginWithSocialAuth } from "@/lib/playfab/client";
import { Provider } from "@/types/auth";
// import PlayFabAdapter from "@/lib/playfab-adapter";
import NextAuth from "next-auth";

// noinspection JSUnusedLocalSymbols
export const { handlers: { GET, POST }, auth, signIn, signOut, update } = NextAuth({
  ...authConfig,
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
  session: { strategy: "jwt" },
  callbacks: {
    signIn: async ({ user, account, profile }) => {
      if (account) {
        const session = await auth();
        if (session !== null) {
          const playFabID = await getPlayFabIDFromSocialLoginID(
            account.provider as Provider,
            user.id,
            session.playFab.SessionTicket,
          );
          if (!playFabID) {
            await linkSocialAuth(account.provider as Provider, session.playFab.SessionTicket, account.access_token);
          }
        }
        if (account.provider === "google" && account.access_token) {
          if (profile && !!profile.email_verified) {
            return true;
          }
          // } else if (account.provider === "discord") {
          //   if (profile && profile.verified) {
          //     return true;
          //   }
        } else if (account.provider === "twitch") {
          return true;
        }
      }

      return false;
    },
    session: async ({ session, token }) => {
      return {
        ...session,
        user: {
          id: token.id,
          email: token.email,
          name: token.name,
          displayName: "",
          image: token.picture,
        },
        account: token.account,
        playFab: token.playFab,
      } as any;
    },
    // The arguments user, account, profile and isNewUser are only passed the first time this callback is called on a
    // new session, after the user signs in. In subsequent calls, only token will be available.
    jwt: async ({ token, user, account, profile, trigger }) => {
      if (trigger === "signIn" || trigger === "signUp") {
        if (account) {
          const playFab = await loginWithSocialAuth(account.provider as Provider, account.access_token);
          await setAccountCookieSessionTicket(playFab.SessionTicket);
          return {
            ...token,
            id: user.id,
            currentProvider: account.provider,
            playFab,
            profile,
            account,
          };
        }
      }
      return token;
    },
  },
  events: {

    signIn: async ({ user, account, profile, isNewUser }) => {

    },
    signOut: async (message) => {
    },
    createUser: async ({ user }) => {

    },
    linkAccount: async ({ user, account, profile }) => {

    },
  },
  // adapter: PlayFabAdapter({}),
});
