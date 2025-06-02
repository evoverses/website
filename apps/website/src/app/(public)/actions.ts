"use server";

import { logout } from "@/thirdweb/auth";

export const signOutAction = async () => {
  await logout();
};
