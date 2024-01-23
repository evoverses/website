"use client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export const LimitSelect = ({ limit = 50 }: { limit: number }) => {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const onValueChange = (value: string) => {
    const newParams = new URLSearchParams(params.toString());
    newParams.set("limit", value);
    router.push(`${path}?${newParams.toString()}`);
  };
  return (
    <Select onValueChange={onValueChange}>
      <SelectTrigger className="w-[80px]">
        <SelectValue defaultValue={limit.toString()} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="10">10</SelectItem>
        <SelectItem value="15">15</SelectItem>
        <SelectItem value="25">25</SelectItem>
        <SelectItem value="50">50</SelectItem>
        <SelectItem value="100">100</SelectItem>
      </SelectContent>
    </Select>
  );
};
