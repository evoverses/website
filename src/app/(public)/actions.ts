"use server";

import { signIn, signOut } from "@/auth";
import { Provider } from "@/types/auth";

export const loginWithAction = async (provider: Provider, formData: FormData) => {
  await signIn(provider);
}

export const signOutAction = async () => {
  await signOut();
};
