"use client";

import Link from "next/link";
import { isToday, isSameMonth, format } from "date-fns";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CoverImage {
  imageId: string;
  thumbnailUrl: string | null;
  photoCount?: number;
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
  const hasThumbnail = coverImage?.thumbnailUrl && inMonth;
  const photoCount = coverImage?.photoCount ?? 0;

  if (!inMonth) {
    return (
      <div
        className={cn(
          "relative aspect-square rounded-xl border transition-colors",
          "bg-muted/20 text-muted-foreground/40"
        )}
      >
        <span className="absolute top-1.5 left-2 text-xs font-medium">
          {date.getDate()}
        </span>
      </div>
    );
  }

  const href = userId ? `/date/${dateStr}?user=${userId}` : `/date/${dateStr}`;

  return (
    <Link
      href={href}
      className={cn(
        "group relative aspect-square rounded-xl border transition-all duration-200 block overflow-hidden",
        "bg-card hover:shadow-lg hover:scale-[1.03] hover:z-10",
        today && "ring-2 ring-rose-400/70 ring-offset-2 ring-offset-background shadow-[0_0_12px_rgba(251,113,133,0.3)]",
        !hasThumbnail && "hover:border-rose-300/50"
      )}
    >
      {/* Cover image */}
      {hasThumbnail && (
        <img
          src={coverImage!.thumbnailUrl!}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
          loading="lazy"
        />
      )}

      {/* Gradient overlay for legibility on images */}
      {hasThumbnail && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
      )}

      {/* Date number */}
      <span
        className={cn(
          "absolute top-1.5 left-2 text-xs font-semibold z-10",
          today && !hasThumbnail && "text-rose-500 font-bold",
          today && hasThumbnail && "text-white font-bold drop-shadow-md",
          !today && hasThumbnail && "text-white/90 drop-shadow-md",
          !today && !hasThumbnail && "text-foreground/70"
        )}
      >
        {date.getDate()}
      </span>

      {/* Photo count badge */}
      {photoCount > 1 && (
        <span className="absolute top-1.5 right-1.5 z-10 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm px-1.5 py-0.5 text-[10px] font-medium text-white min-w-[18px]">
          {photoCount}
        </span>
      )}

      {/* Empty cell hover: + icon */}
      {!hasThumbnail && !readOnly && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Plus className="h-6 w-6 text-muted-foreground/40" />
        </div>
      )}

      {/* Today dot indicator (no image) */}
      {today && !hasThumbnail && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-rose-400" />
      )}
    </Link>
  );
}
