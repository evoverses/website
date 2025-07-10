import { AccountProvider } from "@/components/providers/account-provider";
import type { PropsWithChildren } from "react";

const Layout = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <AccountProvider>
      {children}
    </AccountProvider>
  );
};

export default Layout;
