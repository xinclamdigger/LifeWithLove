import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { parseMonthParam } from "./calendar-queries";

describe("parseMonthParam", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the input when it matches YYYY-MM", () => {
    expect(parseMonthParam("2024-01")).toBe("2024-01");
    expect(parseMonthParam("1999-12")).toBe("1999-12");
  });

  it("falls back to the current month when null", () => {
    expect(parseMonthParam(null)).toBe("2026-04");
  });

  it("falls back to the current month for invalid formats", () => {
    expect(parseMonthParam("")).toBe("2026-04");
    expect(parseMonthParam("2024-1")).toBe("2026-04");
    expect(parseMonthParam("2024/01")).toBe("2026-04");
    expect(parseMonthParam("april")).toBe("2026-04");
    expect(parseMonthParam("2024-13-01")).toBe("2026-04");
  });

  it("does not validate month range — YYYY-MM pattern is enough", () => {
    // The regex only checks shape, not semantic validity. This is the
    // existing contract; downstream code treats month as a string prefix.
    expect(parseMonthParam("2024-00")).toBe("2024-00");
    expect(parseMonthParam("2024-13")).toBe("2024-13");
  });
});
