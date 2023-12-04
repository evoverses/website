import authConfig from "@/auth.config";
import { loginWithGoogle } from "@/lib/playfab";
import NextAuth, { DefaultSession } from "next-auth";
import "server-only";
import { PlayFab } from "./lib/playfab";

declare module "@auth/core" {
  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the second parameter of the `session` callback, when using a database.
   */
  interface User {
  }

  /**
   * The shape of the account object returned in the OAuth providers' `account` callback,
   * Usually contains information about the provider being used, like OAuth tokens (`access_token`, etc).
   */
  interface Account {
  }

  /** Returned by `useSession`, `auth`, contains information about the active session. */
  interface Session {
    user: {} & DefaultSession["user"];
    expires: string;
    playFab: PlayFab.Client.Auth.LoginResponse["data"];
  }

  interface User {
    lastLogin?: Date;
    admin?: boolean;
  }
}

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
        } else if (account.provider === "web3") {
          if (credentials && credentials.sessionTicket) {
            return true;
          }
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
