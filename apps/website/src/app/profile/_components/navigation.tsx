"use client";

import { useProMode } from "@/components/providers/pro-mode-provider";
import { cn } from "@/lib/utils";
import { Button } from "@workspace/ui/components/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HTMLAttributes } from "react";

interface SidebarNavProps extends HTMLAttributes<HTMLElement> {
  items: {
    href: string
    title: string
    proOnly?: boolean
  }[];
}

export const AccountNavigation = ({ className, items, ...props }: SidebarNavProps) => {
  const pathname = usePathname();
  const { proMode } = useProMode();

  return (
    <nav
      className={cn(
        "flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1 justify-center",
        className,
      )}
      {...props}
    >
      {items.filter(item => !item.proOnly || proMode).map((item) => (
        <Button
          key={item.href}
          variant="ghost"
          className={cn(
            "justify-start",
            { "bg-muted pointer-events-none": pathname === item.href },
            { "text-muted-foreground": pathname !== item.href },
          )}
          asChild
        >
          <Link href={item.href}>
            {item.title}
          </Link>
        </Button>
      ))}
    </nav>
  );
};
