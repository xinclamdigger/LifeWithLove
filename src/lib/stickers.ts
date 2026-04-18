export const STICKER_CATALOG = [
  { type: "heart", label: "Heart", src: "/stickers/heart.svg" },
  { type: "sparkle", label: "Sparkles", src: "/stickers/sparkle.svg" },
  { type: "star", label: "Star", src: "/stickers/star.svg" },
  { type: "rainbow", label: "Rainbow", src: "/stickers/rainbow.svg" },
  { type: "kiss", label: "Kiss", src: "/stickers/kiss.svg" },
  { type: "flower", label: "Flower", src: "/stickers/flower.svg" },
  { type: "cake", label: "Cake", src: "/stickers/cake.svg" },
  { type: "sun", label: "Sun", src: "/stickers/sun.svg" },
  { type: "moon", label: "Moon", src: "/stickers/moon.svg" },
  { type: "camera", label: "Camera", src: "/stickers/camera.svg" },
] as const;

export type StickerType = (typeof STICKER_CATALOG)[number]["type"];

export const STICKER_MAP = Object.fromEntries(
  STICKER_CATALOG.map((s) => [s.type, s])
) as Record<StickerType, (typeof STICKER_CATALOG)[number]>;
