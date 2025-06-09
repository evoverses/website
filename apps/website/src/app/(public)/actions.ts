"use server";

import { logout } from "@/lib/thirdweb/auth";

export const signOutAction = async () => {
  await logout();
};
