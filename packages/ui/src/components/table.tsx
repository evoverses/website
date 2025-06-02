import { cn } from "@/lib/utils";
import { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";

const Table = (
  {
    ref,
    className,
    ...props
  }: React.ComponentProps<"table">) => (
  <div className="w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
);
Table.displayName = "Table";

const TableHeader = (
  {
    ref,
    className,
    ...props
  }: HTMLAttributes<HTMLTableSectionElement> & {
    ref: React.RefObject<HTMLTableSectionElement>;
  },
) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
);
TableHeader.displayName = "TableHeader";

const TableBody = (
  {
    ref,
    className,
    ...props
  }: HTMLAttributes<HTMLTableSectionElement> & {
    ref: React.RefObject<HTMLTableSectionElement>;
  },
) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
);
TableBody.displayName = "TableBody";

const TableFooter = (
  {
    ref,
    className,
    ...props
  }: HTMLAttributes<HTMLTableSectionElement> & {
    ref: React.RefObject<HTMLTableSectionElement>;
  },
) => (
  <tfoot
    ref={ref}
    className={cn("bg-primary font-medium text-primary-foreground", className)}
    {...props}
  />
);
TableFooter.displayName = "TableFooter";

const TableRow = (
  {
    ref,
    className,
    ...props
  }: HTMLAttributes<HTMLTableRowElement> & {
    ref: React.RefObject<HTMLTableRowElement>;
  },
) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className,
    )}
    {...props}
  />
);
TableRow.displayName = "TableRow";

const TableHead = (
  {
    ref,
    className,
    ...props
  }: ThHTMLAttributes<HTMLTableCellElement> & {
    ref: React.RefObject<HTMLTableCellElement>;
  },
) => (
  <th
    ref={ref}
    className={cn(
      "h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      "[&>[role=checkbox]]:translate-y-[2px]",
      className,
    )}
    {...props}
  />
);
TableHead.displayName = "TableHead";

const TableCell = (
  {
    ref,
    className,
    ...props
  }: TdHTMLAttributes<HTMLTableCellElement> & {
    ref: React.RefObject<HTMLTableCellElement>;
  },
) => (
  <td
    ref={ref}
    className={cn(
      "p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className,
    )}
    {...props}
  />
);
TableCell.displayName = "TableCell";

const TableCaption = (
  {
    ref,
    className,
    ...props
  }: HTMLAttributes<HTMLTableCaptionElement> & {
    ref: React.RefObject<HTMLTableCaptionElement>;
  },
) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
);
TableCaption.displayName = "TableCaption";

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
