"use client";
import { animations, type EvoAnimationProgress, groups, inProgress } from "@/app/(authenticated)/roadmap/data";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "@/components/ui/data-table/column-header";
import { ColumnDef } from "@tanstack/react-table";

export const columns: ColumnDef<EvoAnimationProgress>[] = [
  {
    accessorKey: "species",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Species" />,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    accessorFn: (row) => {
      const statuses = animations.map(a => row[a]);
      return statuses.every(Boolean)
        ? "Complete"
        : inProgress.includes(row.species)
          ? "In Progress"
          : groups[groups.indexOf(inProgress) + 1].includes(row.species)
            ? "Up Next"
            : statuses.some(Boolean) ? "Backlog" : "Not Started";
    },
    sortingFn: (a, b) => {
      const getWorth = (status: string) => status === "Complete" ? 0 : status === "Up Next" ? 3 : status
      === "In Progress" ? 4 : status === "Backlog" ? 2 : 1;
      const av = getWorth(a.getValue("status"));
      const bv = getWorth(b.getValue("status"));
      return av === bv ? 0 : av > bv ? 1 : -1;
    },
  },
  {
    accessorKey: "group",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Group" />,
  },
  ...animations.map(k => (
    {
      accessorKey: k,
      header: ({ column }) => <DataTableColumnHeader
        column={column}
        title={k.slice(0, 1).toUpperCase() + k.slice(1)}
      />,
      cell: ({ row }) => <Checkbox checked={row.getValue(k)} />,
    } as ColumnDef<EvoAnimationProgress>
  )),
  {
    accessorKey: "progress",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Progress" />,
    accessorFn: (row) => animations.map(a => row[a as keyof EvoAnimationProgress]).filter(Boolean).length,
    cell: ({ row }) => Number(row.getValue<number>("progress") / 7 * 100).toFixed(0) + "%",
  },
];
