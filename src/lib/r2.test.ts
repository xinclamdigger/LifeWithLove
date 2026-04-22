import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getPublicUrl } from "./r2";

describe("getPublicUrl", () => {
  const original = process.env.R2_PUBLIC_URL;

  beforeEach(() => {
    process.env.R2_PUBLIC_URL = "https://cdn.example.com";
  });

  afterEach(() => {
    if (original === undefined) delete process.env.R2_PUBLIC_URL;
    else process.env.R2_PUBLIC_URL = original;
  });

  it("joins base URL and key with a single slash", () => {
    expect(getPublicUrl("path/to/file.jpg")).toBe(
      "https://cdn.example.com/path/to/file.jpg"
    );
  });

  it("reads R2_PUBLIC_URL at call time, not at module load", () => {
    process.env.R2_PUBLIC_URL = "https://other.example.com";
    expect(getPublicUrl("x")).toBe("https://other.example.com/x");
  });

  it("does not normalize double slashes — caller owns the key shape", () => {
    expect(getPublicUrl("/leading")).toBe("https://cdn.example.com//leading");
  });
});
