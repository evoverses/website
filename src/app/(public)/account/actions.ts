"use server";

import { getGoogleAuthUrl } from "@/lib/playfab/auth";
import { redirect } from "next/navigation";

export const onLogInClicked = async (provider: any, formData: FormData) => {
  const authUrl = getGoogleAuthUrl();
  console.log(authUrl);
  redirect(authUrl);
};
