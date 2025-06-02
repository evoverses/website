import { logout } from "@/thirdweb/auth";

export const GET = async () => {
   await logout();
};
