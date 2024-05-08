import QueryProvider from "@/components/providers/query-provider";
import { PropsWithChildren } from "react";

const Layout = ({ children }: PropsWithChildren) => {
  return (
    <QueryProvider>
      {children}
    </QueryProvider>
  );
};

export default Layout;
