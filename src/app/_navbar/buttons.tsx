"use client";

import { Button } from "@/components/ui/button";
import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { Web3Button } from "@web3modal/react";
import { useTheme } from "next-themes";

export const ModeButton = () => {
  const { theme, setTheme } = useTheme();
  const system = !theme || theme === "system";
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark');
  }
  return (
    <Button variant="outline" size="icon" onClick={toggleTheme}>
      {system ? (
        <>
          <SunIcon className="h-[0.6rem] w-[0.6rem] rotate-0 scale-100 -translate-x-3/4 -translate-y-3/4 transition-all dark:-rotate-90" />
          <MoonIcon className="absolute h-[0.6rem] w-[0.6rem] translate-x-3/4 translate-y-3/4 rotate-90 transition-all dark:rotate-0" />
          <div className="absolute border-[1px] border-border h-[1.8rem] w-[1px] rotate-45"></div>
        </>
      ) : theme === 'dark' ? (
        <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      ) : (
        <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};

export const WalletButton = () => {
  return (
    <>
      <div className="hidden md:block">
        <Web3Button icon="hide" avatar="show" balance="show" />
      </div>
      <div className="md:hidden">
        <Web3Button icon="hide" />
      </div>
    </>
  )
}

export const MobileNavButton = () => {



 ///return (
 ///  <Button variant="outline" size="icon" onClick={toggleTheme}>
 ///    {system ? (
 ///      <>
 ///        <SunIcon className="h-[0.6rem] w-[0.6rem] rotate-0 scale-100 -translate-x-3/4 -translate-y-3/4 transition-all dark:-rotate-90" />
 ///        <MoonIcon className="absolute h-[0.6rem] w-[0.6rem] translate-x-3/4 translate-y-3/4 rotate-90 transition-all dark:rotate-0" />
 ///        <div className="absolute border-[1px] border-border h-[1.8rem] w-[1px] rotate-45"></div>
 ///      </>
 ///    ) : theme === 'dark' ? (
 ///      <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
 ///    ) : (
 ///      <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
 ///    )}
 ///    <span className="sr-only">Toggle theme</span>
 ///  </Button>
 ///);
};
