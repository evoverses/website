"use client";

import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes";
import { PropsWithChildren } from "react";

const ThemeProvider = ({ children, ...props }: PropsWithChildren<ThemeProviderProps>) => {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

export default ThemeProvider;
