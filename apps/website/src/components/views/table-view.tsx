"use client";
import { AccountName } from "@/components/account-name";
import { EM_DASH } from "@/utils/strings";
import { CellContext, ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { SquidAsset } from "@workspace/evoverses/lib/asset/types";
import { Badge } from "@workspace/ui/components/badge";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table";
import { cn, cva } from "@workspace/ui/lib/utils";
import { ComponentProps, Fragment, RefObject } from "react";
import TimeAgo from "react-timeago";
import { EvoImage } from "@workspace/evoverses/components/evo-image";
import {
  getLevelOfEvo,
  hasElements,
  isEgg,
  isEvo,
  isEvoAsset,
  toAssetFullName
} from "@workspace/evoverses/lib/asset/utils";
import { formatUnits } from "viem";
import { useBoundedStore } from "@/store";
import { makeArray } from "@workspace/evoverses/utils/numbers";
import { GenderIcon } from "@workspace/evoverses/components/icons/gender-icon";
import { Chroma, Element } from "@workspace/database/types";
import { ElementIcon } from "@workspace/evoverses/components/icons/element-icon";
import { toTitleCase } from "@workspace/evoverses/utils/strings";
import { CheckIcon, XIcon } from "lucide-react";

const tableVariants = cva(
  "group/table",
  {
    variants: {
      variant: {
        table: "",
        "compact-table": ""
      }
    },
    defaultVariants: {
      variant: "table"
    }
  }
);

export const columns: ColumnDef<SquidAsset>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center w-4">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center w-4">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false
  },
  {
    accessorKey: "name",
    header: ({ table }) => {
      return <span className="text-left w-full font-mono block">{table.getRowCount().toLocaleString("en")} items</span>;
    },
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
          <div className="relative size-8 group-data-[variant=compact-table]/table:size-6 rounded-sm overflow-hidden">
            <EvoImage asset={row.original} />
          </div>
          <div className="flex flex-col min-w-0 text-sm text-left font-semibold">
            <span className="break-all truncate">{toAssetFullName(row.original)}</span>
            <span className="text-muted-foreground break-all truncate group-data-[variant=compact-table]/table:hidden">
              Level {getLevelOfEvo(row.original)}
            </span>
          </div>
        </div>
      );
    }
  },
  {
    accessorKey: "generation",
    cell: ({ row }) => {
      return (
        <div className={cn("flex justify-end w-full gap-1 font-mono text-muted-foreground")}>
          {row.original.metadata.generation}
        </div>
      );
    }
  },
  {
    accessorKey: "gender",
    cell: ({ row }) => {
      return (
        <div className={cn("flex justify-end w-full gap-1 font-mono text-muted-foreground")}>
          {isEvoAsset(row.original) ? (
            <GenderIcon value={row.original.metadata.gender}
              className="size-4 group-data-[variant=table]/table:size-6" />
          ) : EM_DASH}
        </div>
      );
    }
  },
  {
    accessorKey: "element",
    cell: ({ row }) => {
      return (
        <div className={cn("flex justify-end w-full gap-1 font-mono text-muted-foreground")}>
          {hasElements(row.original) ?
            [row.original.metadata.primaryType, row.original.metadata.secondaryType]
              .filter(s => s !== Element.none)
              .map((t, i, a) => (
                <ElementIcon
                  key={`${row.original.tokenId}-type-${t}`}
                  value={t}
                  className={cn("size-4 group-data-[variant=table]/table:size-6", {
                    "z-[2]": i === 0,
                    "-ml-1.25": i === 1
                  })}
                  style={{
                    marginLeft: a.length === 1 ? 0 : `${i === 0 ? 0 : -5}px`,
                  }}
                />
              ))
            : EM_DASH}
        </div>
      );
    }
  },
  {
    accessorKey: "nature",
    cell: ({ row }) => {
      return (
        <div className={cn("flex justify-end w-full gap-1 font-mono text-muted-foreground")}>
          {isEvoAsset(row.original) ? toTitleCase(row.original.metadata.nature) : EM_DASH}
        </div>
      );
    }
  },
  {
    accessorKey: "chroma",
    cell: ({ row }) => {
      return (
        <div className={cn("flex justify-end w-full gap-1 font-mono text-muted-foreground")}>
          {isEvoAsset(row.original) && row.original.metadata.chroma !== Chroma.none ? toTitleCase(row.original.metadata.chroma) : EM_DASH}
        </div>
      );
    }
  },
  {
    accessorKey: "rarity",
    cell: () => {
      return (
        <div className={cn("flex justify-end w-full gap-1 font-mono text-muted-foreground")}>
          Unknown
        </div>
      );
    }
  },
  {
    accessorKey: "totalBreeds",
    header: "breeds",
    cell: ({ row }) => {
      return (
        <div className={cn("flex justify-end w-full gap-1 font-mono text-muted-foreground")}>
          {isEvoAsset(row.original) ? row.original.metadata.totalBreeds : EM_DASH}
        </div>
      );
    }
  },
  ...["attack", "special", "defense", "resistance", "speed"].map(k => ({
    accessorKey: k,
    cell: ({ row }: CellContext<SquidAsset, unknown>) => {
      return (
        <div className={cn("flex justify-end w-full gap-1 font-mono text-muted-foreground")}>
          {isEvo(row.original) ? row.original.metadata[k as "attack"] : EM_DASH}
        </div>
      );
    }
  })),
  {
    accessorKey: "size",
    cell: ({ row }) => {
      const size = isEvo(row.original) ? row.original.metadata.size : 0;
      return (
        <div className={cn("flex justify-end w-full gap-1 font-mono text-muted-foreground")}>
          {isEvo(row.original) ? `${size > 0 ? "+" : ""}${size}%` : EM_DASH}
        </div>
      );
    }
  },
  {
    accessorKey: "treated",
    cell: ({ row }) => {
      return (
        <div className={cn("flex justify-end w-full gap-1 font-mono text-muted-foreground")}>
          {isEgg(row.original) ? row.original.metadata.treated ? <CheckIcon /> :
            <XIcon className="size-4 group-data-[variant=table]/table:size-6 text-red-900" /> : EM_DASH}
        </div>
      );
    }
  },
  {
    accessorKey: "price",
    cell: ({ row }) => {
      const listing = row.original.listings.find(l => Date.parse(l.endAt) > Date.now());
      return listing ? (
        <Badge variant="secondary" className="h-8 font-mono text-sm group-data-[variant=compact-table]/table:h-6">
          <span>{Number(Number(formatUnits(BigInt(listing.pricePerToken), 18)).toFixed(0))}</span>
          <span className="text-muted-foreground">EVO</span>
        </Badge>
      ) : EM_DASH;
    }
  },
  {
    accessorKey: "topOffer",
    header: "top offer",
    cell: ({ row }) => {
      return row.original.offers.length > 0 ? (
        <div className="flex justify-end w-full gap-2">
          <span className="text-sm font-semibold">{0}</span>
          <span className="text-muted-foreground">EVO</span>
        </div>
      ) : EM_DASH;
    }
  },
  {
    accessorKey: "lastSale",
    header: "last sale",
    cell: ({ row }) => {

      /* return row.original.lastSale ? (
       <div className="flex justify-end w-full gap-2">
         <span className="text-sm font-semibold">{formatSquidCurrency(row.original.lastSale)}</span>
         <span className="text-muted-foreground">{row.original.lastSale.currency.symbol}</span>
       </div>
     ) : EM_DASH; */
      return EM_DASH;
    }
  },
  {
    accessorKey: "owner",
    cell: ({ row }) => {
      const owner = row.original.owner;
      return owner ? (
        <AccountName
          address={owner}
          className="truncate"
        />
      ) : EM_DASH;
    }
  },
  {
    accessorKey: "listed",
    cell: ({ row }) => {
      const listing = row.original.listings.find(l => Date.parse(l.endAt) > Date.now());
      return listing ? (
        <div className="flex justify-end w-full">
          <span className="text-sm font-semibold">
            <TimeAgo
              date={Number(listing.startAt) * 1000}
              formatter={(v, u, s) => {
                const sUnit = u.toString();
                const unit = sUnit === "month" ? "mo" : sUnit.slice(0, 1);
                return `${v}${unit} ${s}`;
              }}
            />
          </span>
        </div>
      ) : EM_DASH;
    }
  }
];

export const TableView = ({
  items,
  className,
  outerClassName,
  isLoading,
  isFetchingNextPage,
  bottomRef
}: Omit<ComponentProps<"table">, "children"> & {
  outerClassName?: string,
  items: SquidAsset[]
  isLoading?: boolean
  bottomRef?: RefObject<HTMLDivElement | null>
  isFetchingNextPage?: boolean;
}) => {
  const variant = useBoundedStore.use.layout();
  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel()
  });
  if (variant !== "table" && variant !== "compact-table") {
    return null;
  }
  return (
    <Fragment>
      <Table
        className={tableVariants({ className, variant })}
        outerClassName={outerClassName}
        data-variant={variant || "table"}
      >
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead
                    key={header.id}
                    className="uppercase text-xs font-mono text-right break-keep whitespace-nowrap"
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
                  <TableCell key={cell.id} className="text-right group-data-[variant=compact-table]/table:p-1">
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
          {isFetchingNextPage && makeArray(10).map(i => (
            <TableRow
              key={`skeleton-row-${i}`}
              data-state={false}
            >
              {table.getRowModel().rows?.[0]?.getVisibleCells()?.map((cell) => (
                <TableCell key={cell.id} className="text-right group-data-[variant=compact-table]/table:p-1">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {bottomRef && (
        <div ref={bottomRef} className="flex justify-center w-full pb-4" />
      )}
    </Fragment>
  );
};