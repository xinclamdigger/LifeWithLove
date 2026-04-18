"use client";

import React, { useState, useRef, useCallback } from "react";
import { X, RotateCw } from "lucide-react";
import { STICKER_MAP } from "@/lib/stickers";
import { clientToPercent } from "./stickerUtils";
import type { Sticker } from "./useStickerState";

const BASE_SIZE = 48;
const DRAG_THRESHOLD = 5;

interface PlacedStickerProps {
  sticker: Sticker;
  isOwner: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onUpdate: (id: string, updates: Partial<Pick<Sticker, "xPercent" | "yPercent" | "scale" | "rotation" | "zIndex">>) => void;
  onDelete: (id: string) => void;
  onBringToFront: (id: string) => void;
}

export const PlacedSticker = React.memo(function PlacedSticker({
  sticker,
  isOwner,
  containerRef,
  onUpdate,
  onDelete,
  onBringToFront,
}: PlacedStickerProps) {
  const [selected, setSelected] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [rotating, setRotating] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; origX: number; origY: number } | null>(null);
  const resizeStartRef = useRef<{ pointerX: number; pointerY: number; origScale: number } | null>(null);
  const rotateStartRef = useRef<{ startAngle: number; origRotation: number } | null>(null);
  const stickerElRef = useRef<HTMLDivElement>(null);
  const didDragRef = useRef(false);
  const stickerRef = useRef(sticker);
  stickerRef.current = sticker;

  const stickerInfo = STICKER_MAP[sticker.stickerType];
  if (!stickerInfo) return null;

  const size = (BASE_SIZE * sticker.scale) / 100;

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!isOwner || resizing || rotating) return;
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        origX: stickerRef.current.xPercent,
        origY: stickerRef.current.yPercent,
      };
      didDragRef.current = false;
    },
    [isOwner, resizing, rotating]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragStartRef.current || resizing || rotating) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;

      if (!didDragRef.current && Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return;
      didDragRef.current = true;
      setDragging(true);

      const container = containerRef.current;
      if (!container) return;
      const pos = clientToPercent(container, e.clientX, e.clientY);
      onUpdate(stickerRef.current.id, pos);
    },
    [resizing, rotating, containerRef, onUpdate]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragStartRef.current) return;
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);

      if (didDragRef.current) {
        const container = containerRef.current;
        if (container) {
          const pos = clientToPercent(container, e.clientX, e.clientY);
          onUpdate(stickerRef.current.id, pos);
        }
      } else {
        setSelected((prev) => !prev);
        onBringToFront(stickerRef.current.id);
      }

      dragStartRef.current = null;
      setDragging(false);
    },
    [containerRef, onUpdate, onBringToFront]
  );

  // Resize handlers
  const handleResizePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setResizing(true);
      resizeStartRef.current = {
        pointerX: e.clientX,
        pointerY: e.clientY,
        origScale: stickerRef.current.scale,
      };
    },
    []
  );

  const handleResizePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!resizeStartRef.current) return;
      const dy = e.clientY - resizeStartRef.current.pointerY;
      const dx = e.clientX - resizeStartRef.current.pointerX;
      const delta = (dx + dy) / 2;
      const newScale = Math.round(
        Math.max(30, Math.min(300, resizeStartRef.current.origScale + delta))
      );
      onUpdate(stickerRef.current.id, { scale: newScale });
    },
    [onUpdate]
  );

  const handleResizePointerUp = useCallback(
    (e: React.PointerEvent) => {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      setResizing(false);
      resizeStartRef.current = null;
    },
    []
  );

  // Rotation handlers — drag the top handle in a circular motion
  const handleRotatePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setRotating(true);

      const el = stickerElRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);

      rotateStartRef.current = {
        startAngle,
        origRotation: stickerRef.current.rotation,
      };
    },
    []
  );

  const handleRotatePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!rotateStartRef.current) return;

      const el = stickerElRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
      const delta = currentAngle - rotateStartRef.current.startAngle;
      const newRotation = Math.round(((rotateStartRef.current.origRotation + delta) % 360 + 360) % 360);
      onUpdate(stickerRef.current.id, { rotation: newRotation });
    },
    [onUpdate]
  );

  const handleRotatePointerUp = useCallback(
    (e: React.PointerEvent) => {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      setRotating(false);
      rotateStartRef.current = null;
    },
    []
  );

  const handleBlur = useCallback(() => {
    setSelected(false);
  }, []);

  const isInteracting = dragging || resizing || rotating;

  return (
    <div
      ref={stickerElRef}
      className="absolute group"
      style={{
        left: `${sticker.xPercent / 100}%`,
        top: `${sticker.yPercent / 100}%`,
        transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg)`,
        width: `${size}px`,
        height: `${size}px`,
        zIndex: sticker.zIndex + 10,
        pointerEvents: "auto",
        cursor: isOwner ? (dragging ? "grabbing" : "grab") : "default",
        transition: isInteracting ? "none" : "left 0.1s, top 0.1s, width 0.15s, height 0.15s, transform 0.15s",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onBlur={handleBlur}
      tabIndex={-1}
    >
      <img
        src={stickerInfo.src}
        alt={stickerInfo.label}
        className="w-full h-full select-none"
        draggable={false}
      />

      {selected && isOwner && (
        <>
          <div className="absolute inset-[-3px] rounded-lg border-2 border-rose-400 border-dashed pointer-events-none" />

          {/* Delete button */}
          <button
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md hover:bg-rose-600 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(sticker.id);
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <X className="w-3 h-3" />
          </button>

          {/* Rotate handle — top center */}
          <div
            className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-blue-400 border-2 border-white shadow-md cursor-grab active:cursor-grabbing flex items-center justify-center"
            onPointerDown={handleRotatePointerDown}
            onPointerMove={handleRotatePointerMove}
            onPointerUp={handleRotatePointerUp}
          >
            <RotateCw className="w-2.5 h-2.5 text-white" />
          </div>

          {/* Resize handle — bottom right */}
          <div
            className="absolute -bottom-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-400 border-2 border-white shadow-md cursor-nwse-resize"
            onPointerDown={handleResizePointerDown}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
          />
        </>
      )}
    </div>
  );
});
