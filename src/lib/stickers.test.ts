import { describe, it, expect } from "vitest";
import {
  CUSTOM_PREFIX,
  STICKER_CATALOG,
  STICKER_MAP,
  getCustomStickerId,
  isCustomStickerType,
  makeCustomStickerType,
} from "./stickers";

describe("sticker helpers", () => {
  describe("isCustomStickerType", () => {
    it("returns true for types starting with custom:", () => {
      expect(isCustomStickerType("custom:abc123")).toBe(true);
      expect(isCustomStickerType("custom:")).toBe(true);
    });

    it("returns false for built-in sticker types", () => {
      expect(isCustomStickerType("heart")).toBe(false);
      expect(isCustomStickerType("star")).toBe(false);
      expect(isCustomStickerType("")).toBe(false);
    });

    it("is a type guard for `custom:${string}`", () => {
      const t: string = "custom:abc";
      if (isCustomStickerType(t)) {
        // Should compile: narrowed to `custom:${string}`
        const id: string = getCustomStickerId(t);
        expect(id).toBe("abc");
      }
    });
  });

  describe("makeCustomStickerType / getCustomStickerId", () => {
    it("round-trips an id through make → get", () => {
      const id = "xYz_123";
      const type = makeCustomStickerType(id);
      expect(type).toBe(`${CUSTOM_PREFIX}${id}`);
      expect(getCustomStickerId(type)).toBe(id);
    });

    it("preserves empty ids", () => {
      const type = makeCustomStickerType("");
      expect(type).toBe(CUSTOM_PREFIX);
      expect(getCustomStickerId(type)).toBe("");
    });

    it("preserves ids containing a colon", () => {
      const id = "a:b:c";
      const type = makeCustomStickerType(id);
      expect(getCustomStickerId(type)).toBe(id);
    });
  });

  describe("catalog invariants", () => {
    it("has at least one sticker", () => {
      expect(STICKER_CATALOG.length).toBeGreaterThan(0);
    });

    it("has unique types", () => {
      const types = STICKER_CATALOG.map((s) => s.type);
      expect(new Set(types).size).toBe(types.length);
    });

    it("has non-empty label and src for every entry", () => {
      for (const s of STICKER_CATALOG) {
        expect(s.label).not.toBe("");
        expect(s.src).toMatch(/^\/stickers\/.+\.svg$/);
      }
    });

    it("STICKER_MAP matches STICKER_CATALOG entries by type", () => {
      for (const s of STICKER_CATALOG) {
        expect(STICKER_MAP[s.type]).toEqual(s);
      }
    });

    it("uses 'custom:' as the prefix (and it is not a built-in type)", () => {
      expect(CUSTOM_PREFIX).toBe("custom:");
      const builtInTypes = STICKER_CATALOG.map((s) => s.type as string);
      expect(builtInTypes).not.toContain(CUSTOM_PREFIX);
    });
  });
});
