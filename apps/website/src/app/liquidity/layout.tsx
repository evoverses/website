import type { PropsWithChildren } from "react";

// Keep the root wallet/query providers: a nested provider isolates the menu wallet.
export default function LiquidityLayout({ children }: Readonly<PropsWithChildren>) {
  return children;
}
