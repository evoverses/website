import "server-only";
import authConfig from "@/auth.config";
import { loginWithDiscord, loginWithGoogle, loginWithTwitch } from "@/lib/playfab";
import NextAuth from "next-auth";

export const { handlers: { GET, POST }, auth, signIn, signOut, update } = NextAuth({
  ...authConfig,
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
  callbacks: {
    signIn: async ({ user, account, profile, credentials }) => {
      if (account) {
        if (account.provider === "google" && account.access_token) {
          if (profile && !!profile.email_verified) {
            return true;
          }
        } else if (account.provider === "discord") {
          if (profile && profile.verified) {
            return true;
          }
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
    jwt: async ({ token, user, account, profile, trigger, session }) => {
      if (trigger === "signIn" || trigger === "signUp") {
        if (account) {
          if (account.provider === "google" && account.access_token) {
            const playFab = await loginWithGoogle(account.access_token);
            return {
              ...token,
              id: user.id,
              currentProvider: account.provider,
              playFab,
              profile,
              account,
            };
          } else if (account.provider === "discord") {
            const playFab = await loginWithDiscord(account.access_token);
            return {
              ...token,
              id: user.id,
              currentProvider: account.provider,
              playFab: playFab,
              profile,
              account,
            };
          } else if (account.provider === "twitch") {
            const playFab = await loginWithTwitch(account.access_token);
            return {
              ...token,
              id: user.id,
              currentProvider: account.provider,
              playFab: playFab,
              profile,
              account,
            };
          }
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
});
