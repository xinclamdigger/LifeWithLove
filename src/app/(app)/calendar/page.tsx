"use client";

import { useState, useEffect, useRef } from "react";
import { startOfMonth, format } from "date-fns";
import { CalendarNav } from "@/components/calendar/CalendarNav";
import { CalendarGrid, DAY_HEADERS } from "@/components/calendar/CalendarGrid";
import type { CoverImage } from "@/components/calendar/CalendarCell";

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [coverImages, setCoverImages] = useState<Record<string, CoverImage>>({});
  const [loading, setLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    const monthStr = format(currentMonth, "yyyy-MM");

    fetch(`/api/calendar/me?month=${monthStr}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("fetch failed");
        return res.json();
      })
      .then((data: { date: string; imageId: string; thumbnailUrl: string; photoCount?: number }[]) => {
        const map: Record<string, CoverImage> = {};
        for (const item of data) {
          map[item.date] = { imageId: item.imageId, thumbnailUrl: item.thumbnailUrl, photoCount: item.photoCount };
        }
        setCoverImages(map);
      })
      .catch((err) => {
        if (err.name !== "AbortError") setCoverImages({});
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [currentMonth]);

  return (
    <div className="space-y-4">
      <CalendarNav currentMonth={currentMonth} onMonthChange={setCurrentMonth} />
      {loading ? (
        <CalendarGridSkeleton />
      ) : (
        <CalendarGrid currentMonth={currentMonth} coverImages={coverImages} />
      )}
    </div>
  );
}

function CalendarGridSkeleton() {
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
        {Array.from({ length: 42 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-xl bg-muted/30 animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
