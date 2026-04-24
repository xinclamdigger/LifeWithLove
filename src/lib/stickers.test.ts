import { describe, it, expect } from "vitest";
import { STICKER_CATALOG, STICKER_MAP } from "./stickers";

describe("STICKER_CATALOG", () => {
  it("has at least one sticker", () => {
    expect(STICKER_CATALOG.length).toBeGreaterThan(0);
  });

  it("has unique types", () => {
    const types = STICKER_CATALOG.map((s) => s.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it("has a non-empty label and a /stickers/*.svg src for every entry", () => {
    for (const s of STICKER_CATALOG) {
      expect(s.label).not.toBe("");
      expect(s.src).toMatch(/^\/stickers\/.+\.svg$/);
    }
  });
});

describe("STICKER_MAP", () => {
  it("matches STICKER_CATALOG entries by type", () => {
    for (const s of STICKER_CATALOG) {
      expect(STICKER_MAP[s.type]).toEqual(s);
    }
  });

  it("has the same number of entries as STICKER_CATALOG", () => {
    expect(Object.keys(STICKER_MAP).length).toBe(STICKER_CATALOG.length);
  });
});
