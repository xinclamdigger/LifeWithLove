import { useState, useEffect, useRef, useCallback } from "react";
import type { StickerType } from "@/lib/stickers";

export interface Sticker {
  id: string;
  userId: string;
  calendarUserId: string;
  month: string;
  stickerType: StickerType;
  xPercent: number;
  yPercent: number;
  scale: number;
  rotation: number;
  zIndex: number;
  createdAt: string;
}

interface UseStickerStateOptions {
  calendarUserId: string;
  month: string; // "YYYY-MM"
}

export function useStickerState({ calendarUserId, month }: UseStickerStateOptions) {
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [loading, setLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);
  const stickersRef = useRef(stickers);
  stickersRef.current = stickers;

  // Debounce map for PATCH requests during drag
  const pendingPatches = useRef<
    Map<string, { updates: Record<string, number>; timer: ReturnType<typeof setTimeout> }>
  >(new Map());

  useEffect(() => {
    if (!calendarUserId) {
      setStickers([]);
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);

    fetch(`/api/stickers?calendarUserId=${calendarUserId}&month=${month}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error("fetch failed");
        return res.json();
      })
      .then((data: Sticker[]) => {
        setStickers(data);
      })
      .catch((err) => {
        if (err.name !== "AbortError") setStickers([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [calendarUserId, month]);

  // Clean up pending timers on unmount
  useEffect(() => {
    const patches = pendingPatches.current;
    return () => {
      for (const { timer } of patches.values()) clearTimeout(timer);
      patches.clear();
    };
  }, []);

  const addSticker = useCallback(
    async (stickerType: StickerType, xPercent: number, yPercent: number) => {
      const tempId = `temp-${Date.now()}`;
      let maxZ = 0;
      setStickers((prev) => {
        maxZ = prev.reduce((max, s) => Math.max(max, s.zIndex), 0);
        return [
          ...prev,
          {
            id: tempId,
            userId: "",
            calendarUserId,
            month,
            stickerType,
            xPercent,
            yPercent,
            scale: 100,
            rotation: 0,
            zIndex: maxZ + 1,
            createdAt: new Date().toISOString(),
          },
        ];
      });

      try {
        const res = await fetch("/api/stickers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ calendarUserId, month, stickerType, xPercent, yPercent }),
        });
        if (!res.ok) throw new Error("create failed");
        const created: Sticker = await res.json();
        setStickers((prev) =>
          prev.map((s) => (s.id === tempId ? created : s))
        );
      } catch {
        setStickers((prev) => prev.filter((s) => s.id !== tempId));
      }
    },
    [calendarUserId, month]
  );

  const updateSticker = useCallback(
    async (id: string, updates: Partial<Pick<Sticker, "xPercent" | "yPercent" | "scale" | "rotation" | "zIndex">>) => {
      let previous: Sticker | undefined;
      setStickers((prev) => {
        previous = prev.find((s) => s.id === id);
        if (!previous) return prev;
        return prev.map((s) => (s.id === id ? { ...s, ...updates } : s));
      });
      if (!previous) return;

      // Debounce the network call — merge updates for the same sticker
      const pending = pendingPatches.current.get(id);
      if (pending) clearTimeout(pending.timer);

      const merged = { ...(pending?.updates ?? {}), ...updates } as Record<string, number>;
      const snapshotPrevious = previous;
      const timer = setTimeout(async () => {
        pendingPatches.current.delete(id);
        try {
          const res = await fetch("/api/stickers", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, ...merged }),
          });
          if (!res.ok) throw new Error("update failed");
        } catch {
          setStickers((prev) =>
            prev.map((s) => (s.id === id ? snapshotPrevious : s))
          );
        }
      }, 300);

      pendingPatches.current.set(id, { updates: merged, timer });
    },
    []
  );

  const deleteSticker = useCallback(
    async (id: string) => {
      let previous: Sticker | undefined;
      setStickers((prev) => {
        previous = prev.find((s) => s.id === id);
        if (!previous) return prev;
        return prev.filter((s) => s.id !== id);
      });
      if (!previous) return;

      try {
        const res = await fetch(`/api/stickers?id=${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("delete failed");
      } catch {
        const rollback = previous;
        setStickers((prev) => [...prev, rollback]);
      }
    },
    []
  );

  const bringToFront = useCallback(
    (id: string) => {
      const maxZ = stickersRef.current.reduce((max, s) => Math.max(max, s.zIndex), 0);
      updateSticker(id, { zIndex: maxZ + 1 });
    },
    [updateSticker]
  );

  return { stickers, loading, addSticker, updateSticker, deleteSticker, bringToFront };
}
