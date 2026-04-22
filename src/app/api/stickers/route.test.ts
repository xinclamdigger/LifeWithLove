import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  resetDb,
  seedUser,
  seedShare,
  seedSticker,
  getStickerById,
  sessionFor,
  type SeededUser,
} from "../../../../tests/unit/handler-helpers";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

const { auth } = await import("@/lib/auth");
const { GET, POST, PATCH, DELETE } = await import("./route");
const mockedAuth = vi.mocked(auth);

const MONTH = "2026-04";

function jsonRequest(url: string, method: string, body?: unknown) {
  return new NextRequest(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { "content-type": "application/json" } : undefined,
  });
}

describe("/api/stickers", () => {
  let alice: SeededUser;
  let bob: SeededUser;

  beforeEach(async () => {
    await resetDb();
    alice = await seedUser("alice@test.local", "Alice");
    bob = await seedUser("bob@test.local", "Bob");
    mockedAuth.mockReset();
  });

  describe("GET", () => {
    it("401 unauthenticated", async () => {
      mockedAuth.mockResolvedValue(null);
      const res = await GET(
        new NextRequest(
          `http://x/api/stickers?calendarUserId=${alice.id}&month=${MONTH}`
        )
      );
      expect(res.status).toBe(401);
    });

    it("400 when month is missing or malformed", async () => {
      mockedAuth.mockResolvedValue(sessionFor(alice));
      for (const m of ["", "2026", "abc", "2026-4"]) {
        const res = await GET(
          new NextRequest(
            `http://x/api/stickers?calendarUserId=${alice.id}&month=${m}`
          )
        );
        expect(res.status).toBe(400);
      }
    });

    it("403 when caller has no access to the calendar", async () => {
      mockedAuth.mockResolvedValue(sessionFor(bob));
      const res = await GET(
        new NextRequest(
          `http://x/api/stickers?calendarUserId=${alice.id}&month=${MONTH}`
        )
      );
      expect(res.status).toBe(403);
    });

    it("returns stickers for the calendar when caller is a collaborator", async () => {
      await seedShare(alice.id, bob.id);
      await seedSticker({
        userId: alice.id,
        calendarUserId: alice.id,
        month: MONTH,
        stickerType: "heart",
      });
      await seedSticker({
        userId: bob.id,
        calendarUserId: alice.id,
        month: MONTH,
        stickerType: "star",
      });
      // Different month should not appear.
      await seedSticker({
        userId: alice.id,
        calendarUserId: alice.id,
        month: "2026-05",
        stickerType: "moon",
      });

      mockedAuth.mockResolvedValue(sessionFor(bob));
      const res = await GET(
        new NextRequest(
          `http://x/api/stickers?calendarUserId=${alice.id}&month=${MONTH}`
        )
      );
      expect(res.status).toBe(200);
      const types = ((await res.json()) as Array<{ stickerType: string }>).map(
        (s) => s.stickerType
      );
      expect(types.sort()).toEqual(["heart", "star"]);
    });
  });

  describe("POST", () => {
    it("400 when required fields are missing", async () => {
      mockedAuth.mockResolvedValue(sessionFor(alice));
      const res = await POST(
        jsonRequest("http://x/api/stickers", "POST", {
          calendarUserId: alice.id,
          month: MONTH,
        })
      );
      expect(res.status).toBe(400);
    });

    it("403 when posting to a calendar the caller cannot access", async () => {
      mockedAuth.mockResolvedValue(sessionFor(bob));
      const res = await POST(
        jsonRequest("http://x/api/stickers", "POST", {
          calendarUserId: alice.id,
          month: MONTH,
          stickerType: "heart",
          xPercent: 5000,
          yPercent: 5000,
        })
      );
      expect(res.status).toBe(403);
    });

    it("clamps xPercent/yPercent into [0, 10000] and rounds to integers", async () => {
      mockedAuth.mockResolvedValue(sessionFor(alice));

      const below = await POST(
        jsonRequest("http://x/api/stickers", "POST", {
          calendarUserId: alice.id,
          month: MONTH,
          stickerType: "heart",
          xPercent: -500.7,
          yPercent: -9999,
        })
      );
      const above = await POST(
        jsonRequest("http://x/api/stickers", "POST", {
          calendarUserId: alice.id,
          month: MONTH,
          stickerType: "heart",
          xPercent: 99999,
          yPercent: 20000.9,
        })
      );
      const mid = await POST(
        jsonRequest("http://x/api/stickers", "POST", {
          calendarUserId: alice.id,
          month: MONTH,
          stickerType: "heart",
          xPercent: 4242.6,
          yPercent: 1111.4,
        })
      );

      const belowBody = await below.json();
      const aboveBody = await above.json();
      const midBody = await mid.json();
      expect(belowBody.xPercent).toBe(0);
      expect(belowBody.yPercent).toBe(0);
      expect(aboveBody.xPercent).toBe(10000);
      expect(aboveBody.yPercent).toBe(10000);
      expect(midBody.xPercent).toBe(4243);
      expect(midBody.yPercent).toBe(1111);
    });

    it("creates a sticker owned by the session user", async () => {
      // Bob posts onto alice's calendar (he has access via a share).
      await seedShare(alice.id, bob.id);
      mockedAuth.mockResolvedValue(sessionFor(bob));

      const res = await POST(
        jsonRequest("http://x/api/stickers", "POST", {
          calendarUserId: alice.id,
          month: MONTH,
          stickerType: "star",
          xPercent: 5000,
          yPercent: 5000,
        })
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.userId).toBe(bob.id);
      expect(body.calendarUserId).toBe(alice.id);
    });
  });

  describe("PATCH", () => {
    it("400 when id is missing", async () => {
      mockedAuth.mockResolvedValue(sessionFor(alice));
      const res = await PATCH(
        jsonRequest("http://x/api/stickers", "PATCH", { xPercent: 100 })
      );
      expect(res.status).toBe(400);
    });

    it("404 for an unknown sticker", async () => {
      mockedAuth.mockResolvedValue(sessionFor(alice));
      const res = await PATCH(
        jsonRequest("http://x/api/stickers", "PATCH", {
          id: "doesnotexist",
          xPercent: 100,
        })
      );
      expect(res.status).toBe(404);
    });

    it("403 when caller is not the sticker owner", async () => {
      const id = await seedSticker({
        userId: alice.id,
        calendarUserId: alice.id,
        month: MONTH,
      });
      mockedAuth.mockResolvedValue(sessionFor(bob));
      const res = await PATCH(
        jsonRequest("http://x/api/stickers", "PATCH", {
          id,
          xPercent: 100,
        })
      );
      expect(res.status).toBe(403);
    });

    it("clamps scale into [30, 300]", async () => {
      const id = await seedSticker({
        userId: alice.id,
        calendarUserId: alice.id,
        month: MONTH,
      });
      mockedAuth.mockResolvedValue(sessionFor(alice));

      await PATCH(
        jsonRequest("http://x/api/stickers", "PATCH", { id, scale: 5 })
      );
      expect((await getStickerById(id))?.scale).toBe(30);

      await PATCH(
        jsonRequest("http://x/api/stickers", "PATCH", { id, scale: 9999 })
      );
      expect((await getStickerById(id))?.scale).toBe(300);
    });

    it("normalizes rotation into [0, 360)", async () => {
      const id = await seedSticker({
        userId: alice.id,
        calendarUserId: alice.id,
        month: MONTH,
      });
      mockedAuth.mockResolvedValue(sessionFor(alice));

      await PATCH(
        jsonRequest("http://x/api/stickers", "PATCH", { id, rotation: -30 })
      );
      expect((await getStickerById(id))?.rotation).toBe(330);

      await PATCH(
        jsonRequest("http://x/api/stickers", "PATCH", { id, rotation: 725 })
      );
      expect((await getStickerById(id))?.rotation).toBe(5);

      await PATCH(
        jsonRequest("http://x/api/stickers", "PATCH", { id, rotation: 0 })
      );
      expect((await getStickerById(id))?.rotation).toBe(0);
    });
  });

  describe("DELETE", () => {
    it("403 when caller is not the owner", async () => {
      const id = await seedSticker({
        userId: alice.id,
        calendarUserId: alice.id,
        month: MONTH,
      });
      mockedAuth.mockResolvedValue(sessionFor(bob));
      const res = await DELETE(
        new NextRequest(`http://x/api/stickers?id=${id}`, { method: "DELETE" })
      );
      expect(res.status).toBe(403);
      expect(await getStickerById(id)).not.toBeNull();
    });

    it("removes the sticker when owner deletes", async () => {
      const id = await seedSticker({
        userId: alice.id,
        calendarUserId: alice.id,
        month: MONTH,
      });
      mockedAuth.mockResolvedValue(sessionFor(alice));
      const res = await DELETE(
        new NextRequest(`http://x/api/stickers?id=${id}`, { method: "DELETE" })
      );
      expect(res.status).toBe(200);
      expect(await getStickerById(id)).toBeNull();
    });
  });
});
