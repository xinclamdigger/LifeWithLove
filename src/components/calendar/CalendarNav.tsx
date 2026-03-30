"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth } from "date-fns";
import { Button } from "@/components/ui/button";

interface CalendarNavProps {
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
}

export function CalendarNav({ currentMonth, onMonthChange }: CalendarNavProps) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold">
        {format(currentMonth, "MMMM yyyy")}
      </h1>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onMonthChange(subMonths(currentMonth, 1))}
          aria-label="Previous month"
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onMonthChange(startOfMonth(new Date()))}
        >
          Today
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onMonthChange(addMonths(currentMonth, 1))}
          aria-label="Next month"
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
