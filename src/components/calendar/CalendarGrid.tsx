"use client";

import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  getDaysInMonth,
  isSameMonth,
  format,
} from "date-fns";
import { CalendarCell, type CoverImage } from "./CalendarCell";

export const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface CalendarGridProps {
  currentMonth: Date;
  coverImages: Record<string, CoverImage>; // keyed by YYYY-MM-DD
  readOnly?: boolean;
  userId?: string;
}

export function CalendarGrid({ currentMonth, coverImages, readOnly, userId }: CalendarGridProps) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const totalDays = getDaysInMonth(currentMonth);
  const filledDays = days.filter(
    (d) => isSameMonth(d, currentMonth) && coverImages[format(d, "yyyy-MM-dd")]
  ).length;

  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5 mb-1">
        {DAY_HEADERS.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-semibold text-muted-foreground/70 py-2 uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          return (
            <CalendarCell
              key={key}
              date={day}
              currentMonth={currentMonth}
              coverImage={coverImages[key]}
              readOnly={readOnly}
              userId={userId}
            />
          );
        })}
      </div>

      {/* Month progress indicator */}
      {!readOnly && (
        <MonthProgress filled={filledDays} total={totalDays} />
      )}
    </div>
  );
}

function MonthProgress({ filled, total }: { filled: number; total: number }) {
  const pct = total > 0 ? (filled / total) * 100 : 0;

  return (
    <div className="mt-4 flex items-center gap-3">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-rose-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {filled} of {total} days captured
      </span>
    </div>
  );
}
