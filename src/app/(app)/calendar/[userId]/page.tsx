"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { startOfMonth, format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarNav } from "@/components/calendar/CalendarNav";
import { CalendarGrid, DAY_HEADERS } from "@/components/calendar/CalendarGrid";
import type { CoverImage } from "@/components/calendar/CalendarCell";

export default function SharedCalendarPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = use(params);
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [coverImages, setCoverImages] = useState<Record<string, CoverImage>>({});
  const [loading, setLoading] = useState(true);
  const [ownerName, setOwnerName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Fetch owner name from shares API
  useEffect(() => {
    fetch("/api/shares")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const shared = data?.sharedWithMe?.find(
          (s: { ownerId: string }) => s.ownerId === userId
        );
        if (shared) setOwnerName(shared.ownerName);
      })
      .catch(() => {});
  }, [userId]);

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    const monthStr = format(currentMonth, "yyyy-MM");

    fetch(`/api/calendar/${userId}?month=${monthStr}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (res.status === 403) throw new Error("forbidden");
        if (!res.ok) throw new Error("fetch failed");
        return res.json();
      })
      .then((data: { date: string; imageId: string; thumbnailUrl: string }[]) => {
        const map: Record<string, CoverImage> = {};
        for (const item of data) {
          map[item.date] = { imageId: item.imageId, thumbnailUrl: item.thumbnailUrl };
        }
        setCoverImages(map);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setCoverImages({});
          if (err.message === "forbidden") {
            setError("You don't have access to this calendar.");
          }
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [currentMonth, userId]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm font-medium">{error}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => router.push("/calendar")}
        >
          <ArrowLeft />
          Back to My Calendar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <h1 className="text-lg font-semibold text-muted-foreground">
          {ownerName ? `${ownerName}'s Calendar` : "Shared Calendar"}
        </h1>
      </div>
      <CalendarNav currentMonth={currentMonth} onMonthChange={setCurrentMonth} />
      {loading ? (
        <SharedCalendarSkeleton />
      ) : (
        <CalendarGrid
          currentMonth={currentMonth}
          coverImages={coverImages}
          readOnly
          userId={userId}
        />
      )}
    </div>
  );
}

function SharedCalendarSkeleton() {
  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_HEADERS.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 42 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-lg bg-muted/50 animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
