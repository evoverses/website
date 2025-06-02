import { cn } from "@/lib/utils";
import { ChevronLeftIcon, ChevronRightIcon, DotsHorizontalIcon } from "@radix-ui/react-icons";
import { ButtonProps, buttonVariants } from "@workspace/ui/components/button.js";
import Link from "next/link";
import { ComponentProps } from "react";

const Pagination = ({ className, ...props }: ComponentProps<"nav">) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
);

const PaginationContent = (
  {
    ref,
    className,
    ...props
  }: ComponentProps<"ul"> & {
    ref: React.RefObject<HTMLUListElement>;
  },
) => (
  <ul ref={ref} className={cn("flex flex-row items-center gap-1 m-0", className)} {...props} />
);
PaginationContent.displayName = "PaginationContent";

const PaginationItem = (
  {
    ref,
    className,
    ...props
  }: ComponentProps<"li"> & {
    ref: React.RefObject<HTMLLIElement>;
  },
) => (
  <li ref={ref} className={cn("list-none mt-0", className)} {...props} />
);
PaginationItem.displayName = "PaginationItem";

type PaginationLinkProps = { isActive?: boolean } & Pick<ButtonProps, "size" | "disabled"> & ComponentProps<typeof Link>

const PaginationLink = ({ className, isActive, size = "icon", disabled = false, ...props }: PaginationLinkProps) => (
  <PaginationItem>
    <Link
      aria-current={isActive ? "page" : undefined}
      className={cn(
        buttonVariants({ variant: isActive ? "outline" : "ghost", size }),
        { "pointer-events-none opacity-50": disabled },
        className,
      )}
      {...props}
    />
  </PaginationItem>
);
PaginationLink.displayName = "PaginationLink";

const PaginationFirst = ({ className, ...props }: ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to first page"
    size="default"
    className={cn("gap-1 pl-2.5", className)}
    {...props}
  >
    <ChevronLeftIcon className="h-4 w-4" />
    <span>First</span>
  </PaginationLink>
);
PaginationFirst.displayName = "PaginationFirst";

const PaginationPrevious = ({ className, ...props }: ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to previous page"
    size="default"
    className={cn("gap-1 pl-2.5", className)}
    {...props}
  >
    <ChevronLeftIcon className="h-4 w-4" />
    <span>Previous</span>
  </PaginationLink>
);
PaginationPrevious.displayName = "PaginationPrevious";

const PaginationNext = ({ className, ...props }: ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to next page"
    size="default"
    className={cn("gap-1 pr-2.5", className)}
    {...props}
  >
    <span>Next</span>
    <ChevronRightIcon className="h-4 w-4" />
  </PaginationLink>
);
PaginationNext.displayName = "PaginationNext";

const PaginationLast = ({ className, ...props }: ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to last page"
    size="default"
    className={cn("gap-1 pr-2.5", className)}
    {...props}
  >
    <span>Last</span>
    <ChevronRightIcon className="h-4 w-4" />
  </PaginationLink>
);
PaginationLast.displayName = "PaginationLast";

const PaginationEllipsis = ({ className, ...props }: ComponentProps<"span">) => (
  <span
    aria-hidden
    className={cn("flex h-4 w-4 pt-1 items-center justify-center", className)}
    {...props}
  >
    <DotsHorizontalIcon className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
);

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationFirst,
  PaginationPrevious,
  PaginationNext,
  PaginationLast,
  PaginationEllipsis,
};
