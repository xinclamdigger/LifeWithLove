import { describe, it, expect } from "vitest";
import { clientToPercent } from "./stickerUtils";

function makeContainer(rect: {
  left: number;
  top: number;
  width: number;
  height: number;
}): HTMLElement {
  return {
    getBoundingClientRect: () =>
      ({
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        right: rect.left + rect.width,
        bottom: rect.top + rect.height,
        x: rect.left,
        y: rect.top,
        toJSON: () => ({}),
      }) as DOMRect,
  } as unknown as HTMLElement;
}

describe("clientToPercent", () => {
  it("returns (0, 0) at the container top-left", () => {
    const c = makeContainer({ left: 100, top: 50, width: 200, height: 100 });
    expect(clientToPercent(c, 100, 50)).toEqual({ xPercent: 0, yPercent: 0 });
  });

  it("returns (10000, 10000) at the container bottom-right", () => {
    const c = makeContainer({ left: 0, top: 0, width: 200, height: 100 });
    expect(clientToPercent(c, 200, 100)).toEqual({
      xPercent: 10000,
      yPercent: 10000,
    });
  });

  it("returns (5000, 5000) at the center (basis points, not percent)", () => {
    const c = makeContainer({ left: 0, top: 0, width: 200, height: 100 });
    expect(clientToPercent(c, 100, 50)).toEqual({
      xPercent: 5000,
      yPercent: 5000,
    });
  });

  it("clamps negative coordinates to 0", () => {
    const c = makeContainer({ left: 100, top: 100, width: 200, height: 100 });
    expect(clientToPercent(c, 50, 50)).toEqual({ xPercent: 0, yPercent: 0 });
  });

  it("clamps coordinates beyond the container to 10000", () => {
    const c = makeContainer({ left: 0, top: 0, width: 100, height: 100 });
    expect(clientToPercent(c, 500, 500)).toEqual({
      xPercent: 10000,
      yPercent: 10000,
    });
  });

  it("rounds to integers", () => {
    const c = makeContainer({ left: 0, top: 0, width: 300, height: 300 });
    // 1 / 300 * 10000 = 33.33...
    expect(clientToPercent(c, 1, 1)).toEqual({ xPercent: 33, yPercent: 33 });
  });

  it("accounts for container offset", () => {
    const c = makeContainer({ left: 50, top: 50, width: 100, height: 100 });
    expect(clientToPercent(c, 75, 75)).toEqual({
      xPercent: 2500,
      yPercent: 2500,
    });
  });
});
