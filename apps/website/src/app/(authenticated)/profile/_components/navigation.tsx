"use client";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@workspace/ui/components/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HTMLAttributes } from "react";

interface SidebarNavProps extends HTMLAttributes<HTMLElement> {
  items: {
    href: string
    title: string
  }[];
}

export const AccountNavigation = ({ className, items, ...props }: SidebarNavProps) => {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1 justify-center",
        className,
      )}
      {...props}
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            pathname === item.href
              ? "bg-muted hover:bg-muted"
              : "hover:bg-transparent hover:underline",
            "justify-start",
          )}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  );
};
