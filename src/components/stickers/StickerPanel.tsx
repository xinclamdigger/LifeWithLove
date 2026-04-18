"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Sticker as StickerIcon, X } from "lucide-react";
import { STICKER_CATALOG, type StickerType } from "@/lib/stickers";

interface StickerPanelProps {
  selectedStickerType: StickerType | null;
  onSelectSticker: (type: StickerType | null) => void;
  disabled?: boolean;
}

export function StickerPanel({
  selectedStickerType,
  onSelectSticker,
  disabled,
}: StickerPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const handleDragStart = useCallback(
    (e: React.DragEvent, type: StickerType) => {
      e.dataTransfer.setData("sticker-type", type);
      e.dataTransfer.effectAllowed = "copy";
    },
    []
  );

  const handleTapSticker = useCallback(
    (type: StickerType) => {
      if (selectedStickerType === type) {
        onSelectSticker(null);
      } else {
        onSelectSticker(type);
      }
    },
    [selectedStickerType, onSelectSticker]
  );

  // Close panel when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        onSelectSticker(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onSelectSticker]);

  return (
    <div ref={panelRef} className="absolute right-1 top-1 z-30">
      {/* Toggle button */}
      <button
        onClick={() => {
          setIsOpen((prev) => !prev);
          if (isOpen) onSelectSticker(null);
        }}
        className={`
          w-9 h-9 rounded-full shadow-md
          flex items-center justify-center
          transition-all duration-200
          ${isOpen
            ? "bg-rose-500 text-white hover:bg-rose-600"
            : "bg-card/90 backdrop-blur-sm border border-border text-muted-foreground hover:text-foreground hover:shadow-lg"
          }
        `}
        title={isOpen ? "Close sticker panel" : "Open sticker panel"}
      >
        {isOpen ? <X className="w-3.5 h-3.5" /> : <StickerIcon className="w-4 h-4" />}
      </button>

      {/* Expanded panel — drops down from the toggle button */}
      <div
        className={`
          absolute right-0 top-11
          transition-all duration-200 ease-out origin-top-right
          ${isOpen
            ? "opacity-100 scale-100"
            : "opacity-0 scale-95 pointer-events-none"
          }
        `}
      >
        <div className="bg-card border border-border rounded-2xl shadow-xl p-3 w-[136px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 text-center">
            Stickers
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {STICKER_CATALOG.map((sticker) => (
              <button
                key={sticker.type}
                disabled={disabled}
                draggable
                onDragStart={(e) => handleDragStart(e, sticker.type)}
                onClick={() => handleTapSticker(sticker.type)}
                className={`
                  w-[52px] h-[52px] rounded-xl flex items-center justify-center
                  transition-all duration-150 cursor-grab active:cursor-grabbing
                  hover:bg-muted hover:scale-110
                  disabled:opacity-40 disabled:cursor-not-allowed
                  ${selectedStickerType === sticker.type
                    ? "bg-rose-100 ring-2 ring-rose-400 scale-110"
                    : "bg-transparent"
                  }
                `}
                title={sticker.label}
              >
                <img
                  src={sticker.src}
                  alt={sticker.label}
                  className="w-8 h-8 select-none"
                  draggable={false}
                />
              </button>
            ))}
          </div>
          {selectedStickerType && (
            <p className="text-[9px] text-muted-foreground text-center mt-2">
              Tap on calendar to place
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
