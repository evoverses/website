import { signOut } from "@/auth";

export const GET = async () => {
  await signOut({ redirectTo: "/" });
};
