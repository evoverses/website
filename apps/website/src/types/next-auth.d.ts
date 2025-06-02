declare module "@auth/core/types" {
  import { PlayFab } from "@/lib/playfab/types";
  import { type Provider } from "@/types/auth";
  import { type DefaultSession } from "next-auth";

  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the second parameter of the `session` callback, when using a database.
   */
  interface User {
    lastLogin?: Date;
    admin?: boolean;
  }
  /**
   * The shape of the account object returned in the OAuth providers' `account` callback,
   * Usually contains information about the provider being used, like OAuth tokens (`access_token`, etc).
   */
  interface Account {
    provider: Provider;
  }

  /** Returned by `useSession`, `auth`, contains information about the active session. */
  interface Session {
    user: {
      displayName: string;
    } & DefaultSession["user"];
    expires: string;
    playFab: PlayFab.Client.Auth.LoginResponse["data"];
    account: Account;
  }

  interface Profile {
    verified?: boolean;
  }

}
