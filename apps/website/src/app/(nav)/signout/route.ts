import { logout } from "@/lib/thirdweb/auth";

export const GET = async () => {
   await logout();
};
