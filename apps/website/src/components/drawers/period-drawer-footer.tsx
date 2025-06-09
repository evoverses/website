"use client";

import { DatePicker } from "@/components/date-picker";
import { Button } from "@workspace/ui/components/button";
import { DrawerFooter } from "@workspace/ui/components/drawer";
import { Input } from "@workspace/ui/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { cn } from "@workspace/ui/lib/utils";
import { ClockIcon, LoaderCircleIcon } from "lucide-react";
import { type ComponentProps, useState } from "react";

type SetValueOptions = {
  day?: Date,
  hour?: number,
  minute?: number,
  period?: string
}

type UsePeriodResult = {
  period: string,
  customDate: Date | undefined,
  setPeriod: (v: SetValueOptions) => void
}

const usePeriod = (): UsePeriodResult => {
  const [ period, setPeriod ] = useState<string>((
    86_400 * 7
  ).toString());
  const [ customDate, setCustomDate ] = useState<Date | undefined>(undefined);

  const setValue = ({ day, hour, minute, ...rest }: SetValueOptions) => {
    if (rest.period) {
      setPeriod(rest.period);
      return;
    }

    const d = customDate || new Date();
    if (day) {
      d.setUTCFullYear(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate());
    }
    if (hour) {
      d.setHours(Math.max(Math.min(hour, 23), 0));
    }
    if (minute) {
      d.setMinutes(Math.max(Math.min(minute, 59), 0));
    }
    setCustomDate(d);
  };

  return {
    period, customDate, setPeriod: setValue,
  };
};

const PeriodDrawerFooter = ({
  data: { period, customDate, setPeriod },
  progress,
  className,
  children,
  ...props
}: ComponentProps<typeof DrawerFooter> & { data: UsePeriodResult, progress?: string }) => {

  return (
    <DrawerFooter className={cn("px-0 justify-end md:flex-row")} {...props}>
      {progress && (
        <div className="flex items-center gap-2 flex-1">
          <span>Status: {progress}...</span>
          <LoaderCircleIcon className="animate-spin" />
        </div>
      )}
      {period === "custom" && (
        <div className="grid grid-cols-2 gap-2">
          <DatePicker className="w-full" />
          <div className="inline-flex items-center border border-input px-3 py-1.5 rounded-md w-full justify-center text-sm">
            <ClockIcon className="size-4 mr-1" />
            <Input
              type="number"
              min={0}
              max={24}
              onChange={e => setPeriod({ hour: Number(e.target.value) })}
              placeholder="00"
              value={(
                period === "custom" && customDate
              ) ? customDate.getUTCHours().toString() : ""}
              className="px-0 py-0 border-none focus-visible:border-none focus-visible:ring-0 no-spinner w-5 font-mono h-fit placeholder:text-foreground"
            />
            <span className="mr-1">:</span>
            <Input
              type="number"
              min={0}
              max={59}
              onChange={e => setPeriod({ minute: Number(e.target.value) })}
              placeholder="00"
              value={(
                period === "custom" && customDate
              ) ? customDate.getUTCMinutes().toString() : ""}
              className="px-0 py-0 border-none focus-visible:border-none focus-visible:ring-0 no-spinner w-5 font-mono h-fit placeholder:text-foreground"
            />
          </div>
        </div>
      )}
      <div className="gap-2 grid grid-cols-2">
        <Select value={period} onValueChange={v => setPeriod({ period: v })}>
          <SelectTrigger className="ww-[180px]">
            <SelectValue placeholder="Theme" />
          </SelectTrigger>
          <SelectContent>
            {[ 86_400, 86_400 * 3, 86_400 * 7, 86_400 * 30 ].map((v, i) => (
              <SelectItem key={v.toString()} value={v.toString()}>
                {v / 86_400} Day{i === 0 ? "" : "s"}
              </SelectItem>
            ))}
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
        <Button asChild>
          {children}
        </Button>
      </div>
    </DrawerFooter>
  );
};
PeriodDrawerFooter.displayName = "PeriodDrawerFooter";

export { PeriodDrawerFooter, usePeriod };
