"use client";

import { Button } from "@workspace/ui/components/button";
import { Calendar } from "@workspace/ui/components/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover";
import { cn } from "@workspace/ui/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { type ComponentProps, useState } from "react";

const DatePicker = ({
  onValueChange,
  className,
  ...props
}: ComponentProps<typeof Button> & {
  onValueChange?: (date: Date) => void
}) => {
  const [ date, setDate ] = useState<Date>();
  const handleDateChange = (value?: Date) => {
    if (date === value) {
      return;
    }
    if (!value) {
      value = new Date();
    }
    setDate(value);
    onValueChange?.(value);
  };
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-30 justify-start text-left font-normal font-mono", className)}
          {...props}
        >
          <CalendarIcon />
          {format(date || new Date(Date.now()), "dd/MM/yy")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateChange}
          initialFocus
          required
          disabled={{ before: new Date() }}
        />
      </PopoverContent>
    </Popover>
  );
};
DatePicker.displayName = "DatePicker";
export { DatePicker };
