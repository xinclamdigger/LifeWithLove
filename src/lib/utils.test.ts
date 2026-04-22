import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("joins class names with a space", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("filters falsy values", () => {
    expect(cn("a", false, null, undefined, "", "b")).toBe("a b");
  });

  it("supports conditional objects", () => {
    expect(cn("a", { b: true, c: false })).toBe("a b");
  });

  it("flattens nested arrays", () => {
    expect(cn(["a", ["b", "c"]], "d")).toBe("a b c d");
  });

  it("merges conflicting Tailwind utilities (last wins)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-sm text-lg")).toBe("text-lg");
  });

  it("keeps non-conflicting Tailwind utilities", () => {
    expect(cn("px-2 py-1", "bg-red-500")).toBe("px-2 py-1 bg-red-500");
  });

  it("returns an empty string for no input", () => {
    expect(cn()).toBe("");
  });
});
