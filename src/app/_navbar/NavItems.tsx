"use client";
import { navigation } from "@/app/_navbar/navigation";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useMediaQuery } from "usehooks-ts";

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
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
  )
})
ListItem.displayName = "ListItem"

const NavItems = () => {
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
        <NavigationMenuItem >
          <NavigationMenuTrigger className="">Links</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid grid-cols-1 m-0 ml-4 mb-1 w-[200px] list-none">
              {navigation.map(({ name, href, description }, key) => (
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
      {navigation.map(({ href, name }, key) => (
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
