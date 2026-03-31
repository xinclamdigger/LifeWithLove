"use client";

import { useState, useEffect, useRef } from "react";
import { startOfMonth, format, isSameMonth } from "date-fns";
import Link from "next/link";
import { Heart, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarNav } from "@/components/calendar/CalendarNav";
import { CalendarGrid, DAY_HEADERS } from "@/components/calendar/CalendarGrid";
import type { CoverImage } from "@/components/calendar/CalendarCell";

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [coverImages, setCoverImages] = useState<Record<string, CoverImage>>({});
  const [loading, setLoading] = useState(true);
  const [everHadPhotos, setEverHadPhotos] = useState<boolean | null>(null);
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
        // If viewing the current month and there are photos, we know they've used the app
        if (isSameMonth(currentMonth, new Date()) && data.length > 0) {
          setEverHadPhotos(true);
        } else if (everHadPhotos === null && data.length === 0 && isSameMonth(currentMonth, new Date())) {
          setEverHadPhotos(false);
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") setCoverImages({});
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [currentMonth]);

  const isEmpty = !loading && Object.keys(coverImages).length === 0;
  const isFirstTime = isEmpty && everHadPhotos === false && isSameMonth(currentMonth, new Date());

  return (
    <div className="space-y-4">
      <CalendarNav currentMonth={currentMonth} onMonthChange={setCurrentMonth} />
      {loading ? (
        <CalendarGridSkeleton />
      ) : (
        <>
          {isFirstTime && <FirstTimeCard />}
          {isEmpty && !isFirstTime && (
            <EmptyMonthBanner month={format(currentMonth, "MMMM")} />
          )}
          <CalendarGrid currentMonth={currentMonth} coverImages={coverImages} />
        </>
      )}
    </div>
  );
}

function FirstTimeCard() {
  return (
    <div className="rounded-2xl border bg-gradient-to-br from-rose-50 to-pink-50 p-6 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
        <Heart className="h-6 w-6 text-rose-500" />
      </div>
      <h2 className="text-lg font-semibold">Start your story together</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Upload your first photo to begin capturing life&apos;s moments on your shared calendar.
      </p>
      <Link href="/upload" className="inline-block mt-4">
        <Button size="sm" className="bg-rose-500 hover:bg-rose-600">
          <Camera className="mr-1.5 h-4 w-4" />
          Upload Your First Photo
        </Button>
      </Link>
    </div>
  );
}

function EmptyMonthBanner({ month }: { month: string }) {
  return (
    <div className="rounded-xl border border-dashed border-muted-foreground/20 bg-muted/10 px-4 py-3 text-center">
      <p className="text-sm text-muted-foreground">
        No moments captured in {month} yet.{" "}
        <Link href="/upload" className="text-rose-500 hover:text-rose-600 font-medium underline-offset-2 hover:underline">
          Add a photo
        </Link>
      </p>
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
