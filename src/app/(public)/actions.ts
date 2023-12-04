"use server";

import { signIn, signOut } from "@/auth";
import { Provider } from "@/types/auth";

export const loginWithAction = async (provider: Provider, formData: FormData) => {

  switch (provider) {
    case "web3":
      const address = formData.get("address") as string;
      if (!address) {
        return;
      }
      await signIn("web3", { address });
      break;
    case "google":
      await signIn("google");
      break;
    default:
      return;
  }
}

export const signOutAction = async () => {
  "use server";
  await signOut();
};
