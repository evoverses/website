"use client";
import ThemeProvider from "@/components/providers/theme-provider";
import { PropsWithChildren } from "react";

export const GlobalProvider = ({ children }: PropsWithChildren) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  );
};
