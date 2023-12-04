import { type DefaultSession } from "next-auth";

declare module "@auth/core" {
  import { PlayFab } from "@/lib/playfab/types";

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
