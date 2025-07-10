"use client";

import { animations } from "@/app/roadmap/data";
import { cn } from "@/lib/utils";
import {
  ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Input } from "@workspace/ui/components/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table";
import { useEffect, useState } from "react";
import { useMediaQuery } from "usehooks-ts";

interface DataTableProps<TData, TValue> extends React.ComponentProps<"div"> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

const defaultSortState = [ { id: "status", desc: true }, { id: "group", desc: false } ];
const defaultCompactColumnVisibility = animations.reduce((o, a) => (
  { ...o, [a]: false }
), {});

export const DataTable = <TData, TValue>({ columns, data, className, ...props }: DataTableProps<TData, TValue>) => {
  const wide = useMediaQuery("(min-width: 1024px)");
  const [ columnFilters, setColumnFilters ] = useState<ColumnFiltersState>([]);
  const [ columnVisibility, setColumnVisibility ] = useState<VisibilityState>({});
  const [ sorting, setSorting ] = useState<SortingState>(defaultSortState);
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: { sorting, columnFilters, columnVisibility },
  });

  useEffect(() => {
    table.setColumnVisibility(wide ? {} : defaultCompactColumnVisibility);
  }, [ wide, table ]);
  return (
    <div className={cn("", className)} {...props} >
      <div className="flex lg:justify-between gap-4 p-4">
        <Input
          placeholder="Filter species..."
          value={(
            table.getColumn("species")?.getFilterValue() as string
          ) ?? ""}
          onChange={event => table.getColumn("species")?.setFilterValue(event.target.value)}
          className="w-full max-w-[10rem]"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Columns</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter(column => column.getCanHide())
              .map(column => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={column.toggleVisibility}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
