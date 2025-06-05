"use client";

import { NavItem } from "@/app/(nav)/navbar";
import { useMounted } from "@/lib/hooks/useMounted";
import { cn } from "@/lib/utils";
import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { Button } from "@workspace/ui/components/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@workspace/ui/components/navigation-menu";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ComponentProps, useEffect, useState } from "react";
import { useMediaQuery } from "usehooks-ts";

const ListItem = ({ className, title, children, ...props }: ComponentProps<"a">) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors",
            "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className,
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
};
ListItem.displayName = "ListItem";

const NavItems = ({ navItems, isConnected }: { navItems: NavItem[]; isConnected: boolean; }) => {
  const pathname = usePathname();
  const mobile = useMediaQuery("(max-width: 640px)");
  const [ mounted, setMounted ] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return mobile ? (
    <NavigationMenu className="space-x-0">
      <NavigationMenuList className="m-0">
        <NavigationMenuItem>
          <NavigationMenuTrigger className="">Links</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid grid-cols-1 m-0 ml-4 mb-1 w-50 list-none">
              {navItems.filter(i => !i.authRequired || isConnected).map(({ name, href, description }, key) => (
                <ListItem key={key} title={name} href={href}>{description}</ListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ) : navItems.filter(i => !i.authRequired || isConnected).map(({ href, name, comingSoon }, key) => comingSoon ? (
    <Tooltip key={key}>
      <TooltipTrigger className="text-sm font-medium transition-colors text-muted-foreground hover:text-primary">
        {name}
      </TooltipTrigger>
      <TooltipContent className="text-base font-bold">
        Coming Soon!
      </TooltipContent>
    </Tooltip>
  ) : (
    <Link
      key={key}
      href={href}
      className={cn(
        "text-sm font-medium transition-colors hover:text-primary",
        { "text-muted-foreground": !pathname.startsWith(href) },
      )}
    >
      {name}
    </Link>
  ));
};

export default NavItems;

export const ModeButton = () => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const system = !theme || theme === "system";
  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  if (!mounted) {
    return (
      <Skeleton className="size-9 border border-input shadow-sm" />
    );
  }
  return (
    <Button variant="outline" size="icon" className="relative" onClick={toggleTheme}>
      {system ? (
        <>
          <SunIcon
            className={cn(
              "size-[0.6rem] rotate-0 scale-100 -translate-x-3/4 -translate-y-3/4",
              "transition-all dark:-rotate-90",
            )}
          />
          <MoonIcon
            className={cn(
              "absolute size-[0.6rem] translate-x-3/4 translate-y-3/4 rotate-90",
              "transition-all dark:rotate-0",
            )}
          />
          <div className="absolute border-[1px] border-border h-[1.8rem] w-[1px] rotate-45"></div>
        </>
      ) : theme === "dark" ? (
        <MoonIcon
          className={cn(
            "absolute sie-[1.2rem] rotate-90 scale-0 top-1/2 left-1/2 -translate-1/2 transition-all dark:rotate-0 dark:scale-100",
          )}
        />
      ) : (
        <SunIcon className="size-[1.2rem] rotate-0 scale-100 absolute top-1/2 left-1/2 -translate-1/2 transition-all dark:-rotate-90 dark:scale-0" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};
