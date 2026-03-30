"use client";

import Link from "next/link";
import { isToday, isSameMonth, format } from "date-fns";
import { cn } from "@/lib/utils";

export interface CoverImage {
  imageId: string;
  thumbnailUrl: string | null;
}

interface CalendarCellProps {
  date: Date;
  currentMonth: Date;
  coverImage?: CoverImage;
  readOnly?: boolean;
  userId?: string;
}

export function CalendarCell({
  date,
  currentMonth,
  coverImage,
  readOnly,
  userId,
}: CalendarCellProps) {
  const inMonth = isSameMonth(date, currentMonth);
  const today = isToday(date);
  const dateStr = format(date, "yyyy-MM-dd");

  const content = (
    <>
      <span
        className={cn(
          "absolute top-1 left-1.5 text-xs font-medium z-10",
          today && "text-primary font-bold",
          !inMonth && "text-muted-foreground/40",
          coverImage?.thumbnailUrl && inMonth && "text-white drop-shadow-md"
        )}
      >
        {date.getDate()}
      </span>
      {coverImage?.thumbnailUrl && inMonth && (
        <img
          src={coverImage.thumbnailUrl}
          alt=""
          className="absolute inset-0 h-full w-full rounded-lg object-cover"
          loading="lazy"
        />
      )}
    </>
  );

  if (!inMonth) {
    return (
      <div
        className={cn(
          "relative aspect-square rounded-lg border transition-colors",
          "bg-muted/30 text-muted-foreground/50"
        )}
      >
        {content}
      </div>
    );
  }

  const href = userId ? `/date/${dateStr}?user=${userId}` : `/date/${dateStr}`;

  return (
    <Link
      href={href}
      className={cn(
        "relative aspect-square rounded-lg border transition-colors block",
        "bg-card hover:border-primary/50 cursor-pointer",
        today && !userId && "ring-2 ring-primary ring-offset-2 ring-offset-background"
      )}
    >
      {content}
    </Link>
  );
}
