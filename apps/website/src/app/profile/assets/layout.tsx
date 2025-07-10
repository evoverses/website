import { SortFilterProvider } from "@/components/filters";
import type { PropsWithChildren } from "react";

const Layout = ({ children }: PropsWithChildren) => {
  return (
    <SortFilterProvider>
      {children}
    </SortFilterProvider>
  );
};

export default Layout;
