"use client";

import { NavItem } from "@/app/(authenticated)/navbar";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useMounted } from "@/lib/hooks/useMounted";
import { cn } from "@/lib/utils";
import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { Session } from "next-auth";
import { useTheme } from "next-themes";
import Link from "next/link";
import { ComponentPropsWithoutRef, ElementRef, forwardRef, useEffect, useState } from "react";
import { useMediaQuery } from "usehooks-ts";

const ListItem = forwardRef<ElementRef<"a">, ComponentPropsWithoutRef<"a">>((
  { className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
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
});
ListItem.displayName = "ListItem";

interface NavItemsProps {
  navItems: NavItem[];
  session: Session | null;
}

const NavItems = ({ navItems, session }: NavItemsProps) => {
  const active = false;
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
            <ul className="grid grid-cols-1 m-0 ml-4 mb-1 w-[200px] list-none">
              {navItems.filter(i => !i.authRequired || !!session).map(({ name, href, description }, key) => (
                <ListItem
                  key={key}
                  title={name}
                  href={href}
                >
                  {description}
                </ListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ) : (
    <>
      {navItems.filter(i => !i.authRequired || !!session).map(({ href, name }, key) => (
        <Link
          key={key}
          href={href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            active || "text-muted-foreground",
          )}
        >
          {name}
        </Link>
      ))}
    </>
  );
};

export default NavItems;
export const ModeButton = () => {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  const system = !theme || theme === "system";
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : theme === "light" ? "system" : "dark");
  };

  if (!mounted) {
    return (
      <Skeleton className="w-[36px] h-[36px] border border-input shadow-sm" />
    );
  }
  return (
    <Button variant="outline" size="icon" onClick={toggleTheme}>
      {system ? (
        <>
          <SunIcon
            className={cn(
              "h-[0.6rem] w-[0.6rem] rotate-0 scale-100 -translate-x-3/4 -translate-y-3/4",
              "transition-all dark:-rotate-90",
            )}
          />
          <MoonIcon
            className={cn(
              "absolute h-[0.6rem] w-[0.6rem] translate-x-3/4 translate-y-3/4 rotate-90",
              "transition-all dark:rotate-0",
            )}
          />
          <div className="absolute border-[1px] border-border h-[1.8rem] w-[1px] rotate-45"></div>
        </>
      ) : theme === "dark" ? (
        <MoonIcon
          className={cn(
            "absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100",
          )}
        />
      ) : (
        <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};
