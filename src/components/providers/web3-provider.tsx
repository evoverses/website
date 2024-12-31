"use client";
import type { PropsWithChildren } from "react";
import { ThirdwebProvider as ThirdwebReactProvider } from "thirdweb/react";

const ThirdwebProvider = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <ThirdwebReactProvider>
      {children}
    </ThirdwebReactProvider>
  );
}
ThirdwebProvider.displayName = "ThirdwebProviderWrapper";

export { ThirdwebProvider };
