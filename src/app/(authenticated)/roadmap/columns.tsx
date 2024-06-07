"use client";
import { type EvoAnimationProgress, groups, inProgress } from "@/app/(authenticated)/roadmap/data";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "@/components/ui/data-table/column-header";
import { ColumnDef } from "@tanstack/react-table";

const animations = [ "idle", "attack", "dash", "backUp", "hit", "death", "special" ];

export const columns: ColumnDef<EvoAnimationProgress>[] = [
  {
    accessorKey: "species",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Species" />,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    accessorFn: (row) => {
      const statuses = animations.map(a => row[a as keyof EvoAnimationProgress]);
      return statuses.every(Boolean)
        ? "Complete"
        : inProgress.includes(row.species)
          ? "In Progress"
          : groups[groups.indexOf(inProgress) + 1].includes(row.species)
            ? "Up Next"
            : statuses.some(Boolean) ? "Backlog" : "Not Started";
    },
    sortingFn: (a, b) => {
      const getWorth = (status: string) => status === "Complete" ? 4 : status === "Up Next" ? 3 : status
      === "In Progress" ? 2 : status === "Backlog" ? 1 : 0;
      const av = getWorth(a.getValue("status"));
      const bv = getWorth(b.getValue("status"));
      return av === bv ? 0 : av > bv ? 1 : -1;
    },
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
