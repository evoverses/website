import { AccountProvider } from "@/components/providers";
import { PropsWithChildren } from "react";

export default function Layout({ children }: PropsWithChildren) {
  return (
    <AccountProvider>
      {children}
    </AccountProvider>
  );
}
