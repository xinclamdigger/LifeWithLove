"use client";

import { useState, useRef, useCallback } from "react";
import { PlacedSticker } from "./PlacedSticker";
import { clientToPercent } from "./stickerUtils";
import type { Sticker } from "./useStickerState";
import type { StickerType } from "@/lib/stickers";

interface StickerOverlayProps {
  stickers: Sticker[];
  currentUserId: string;
  selectedStickerType: StickerType | null;
  onAdd: (stickerType: StickerType, xPercent: number, yPercent: number) => void;
  onUpdate: (id: string, updates: Partial<Pick<Sticker, "xPercent" | "yPercent" | "scale" | "rotation" | "zIndex">>) => void;
  onDelete: (id: string) => void;
  onBringToFront: (id: string) => void;
  onStickerPlaced: () => void;
}

export function StickerOverlay({
  stickers,
  currentUserId,
  selectedStickerType,
  onAdd,
  onUpdate,
  onDelete,
  onBringToFront,
  onStickerPlaced,
}: StickerOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const stickerType = e.dataTransfer.getData("sticker-type") as StickerType;
      if (!stickerType) return;

      const container = containerRef.current;
      if (container) {
        const pos = clientToPercent(container, e.clientX, e.clientY);
        onAdd(stickerType, pos.xPercent, pos.yPercent);
      }
    },
    [onAdd]
  );

  // Use onMouseDown instead of onClick to fire before the panel's
  // outside-click handler can clear selectedStickerType
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!selectedStickerType) return;
      e.stopPropagation();
      const container = containerRef.current;
      if (container) {
        const pos = clientToPercent(container, e.clientX, e.clientY);
        onAdd(selectedStickerType, pos.xPercent, pos.yPercent);
        onStickerPlaced();
      }
    },
    [selectedStickerType, onAdd, onStickerPlaced]
  );

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      style={{
        pointerEvents: isDragOver || selectedStickerType ? "auto" : "none",
        cursor: selectedStickerType ? "crosshair" : undefined,
        zIndex: isDragOver || selectedStickerType ? 25 : 15,
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onMouseDown={handleMouseDown}
    >
      {/* Drop indicator */}
      {isDragOver && (
        <div className="absolute inset-0 border-2 border-dashed border-rose-400/50 rounded-xl bg-rose-50/10 pointer-events-none" />
      )}

      {/* Tap-to-place indicator */}
      {selectedStickerType && (
        <div className="absolute inset-0 border-2 border-dashed border-rose-400/30 rounded-xl pointer-events-none" />
      )}

      {/* Placed stickers */}
      {stickers.map((sticker) => (
        <PlacedSticker
          key={sticker.id}
          sticker={sticker}
          isOwner={sticker.userId === currentUserId}
          containerRef={containerRef}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onBringToFront={onBringToFront}
        />
      ))}
    </div>
  );
}
