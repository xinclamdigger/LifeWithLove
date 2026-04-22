import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  resetDb,
  seedUser,
  seedShare,
  sessionFor,
  countShares,
  type SeededUser,
} from "../../../../tests/unit/handler-helpers";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

const { auth } = await import("@/lib/auth");
const { GET, POST, DELETE } = await import("./route");
const mockedAuth = vi.mocked(auth);

function jsonRequest(url: string, method: string, body?: unknown) {
  return new NextRequest(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { "content-type": "application/json" } : undefined,
  });
}

describe("/api/shares", () => {
  let alice: SeededUser;
  let bob: SeededUser;

  beforeEach(async () => {
    await resetDb();
    alice = await seedUser("alice@test.local", "Alice");
    bob = await seedUser("bob@test.local", "Bob");
    mockedAuth.mockReset();
  });

  describe("GET", () => {
    it("returns 401 when unauthenticated", async () => {
      mockedAuth.mockResolvedValue(null);
      const res = await GET();
      expect(res.status).toBe(401);
    });

    it("splits shares into sharedByMe and sharedWithMe", async () => {
      await seedShare(alice.id, bob.id); // alice → bob
      const carol = await seedUser("carol@test.local", "Carol");
      await seedShare(carol.id, alice.id); // carol → alice

      mockedAuth.mockResolvedValue(sessionFor(alice));
      const res = await GET();
      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        sharedByMe: Array<{ sharedWithEmail: string }>;
        sharedWithMe: Array<{ ownerEmail: string }>;
      };
      expect(body.sharedByMe.map((s) => s.sharedWithEmail)).toEqual([
        bob.email,
      ]);
      expect(body.sharedWithMe.map((s) => s.ownerEmail)).toEqual([carol.email]);
    });
  });

  describe("POST", () => {
    it("returns 401 when unauthenticated", async () => {
      mockedAuth.mockResolvedValue(null);
      const res = await POST(
        jsonRequest("http://x/api/shares", "POST", { email: bob.email })
      );
      expect(res.status).toBe(401);
    });

    it("returns 400 when email is missing", async () => {
      mockedAuth.mockResolvedValue(sessionFor(alice));
      const res = await POST(jsonRequest("http://x/api/shares", "POST", {}));
      expect(res.status).toBe(400);
    });

    it("rejects sharing with yourself", async () => {
      mockedAuth.mockResolvedValue(sessionFor(alice));
      const res = await POST(
        jsonRequest("http://x/api/shares", "POST", { email: alice.email })
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/yourself/i);
      expect(await countShares()).toBe(0);
    });

    it("returns 404 when the target user does not exist", async () => {
      mockedAuth.mockResolvedValue(sessionFor(alice));
      const res = await POST(
        jsonRequest("http://x/api/shares", "POST", {
          email: "nobody@test.local",
        })
      );
      expect(res.status).toBe(404);
      expect(await countShares()).toBe(0);
    });

    it("returns 409 when already shared", async () => {
      await seedShare(alice.id, bob.id);
      mockedAuth.mockResolvedValue(sessionFor(alice));
      const res = await POST(
        jsonRequest("http://x/api/shares", "POST", { email: bob.email })
      );
      expect(res.status).toBe(409);
      expect(await countShares()).toBe(1);
    });

    it("creates a share on the happy path", async () => {
      mockedAuth.mockResolvedValue(sessionFor(alice));
      const res = await POST(
        jsonRequest("http://x/api/shares", "POST", { email: bob.email })
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.sharedWithId).toBe(bob.id);
      expect(body.sharedWithEmail).toBe(bob.email);
      expect(await countShares()).toBe(1);
    });
  });

  describe("DELETE", () => {
    it("returns 400 when no id is provided", async () => {
      mockedAuth.mockResolvedValue(sessionFor(alice));
      const res = await DELETE(
        new NextRequest("http://x/api/shares", { method: "DELETE" })
      );
      expect(res.status).toBe(400);
    });

    it("returns 404 for a missing share id", async () => {
      mockedAuth.mockResolvedValue(sessionFor(alice));
      const res = await DELETE(
        new NextRequest("http://x/api/shares?id=doesnotexist", {
          method: "DELETE",
        })
      );
      expect(res.status).toBe(404);
    });

    it("returns 403 when the caller is not the share owner", async () => {
      const shareId = await seedShare(alice.id, bob.id);
      mockedAuth.mockResolvedValue(sessionFor(bob));
      const res = await DELETE(
        new NextRequest(`http://x/api/shares?id=${shareId}`, {
          method: "DELETE",
        })
      );
      expect(res.status).toBe(403);
      expect(await countShares()).toBe(1);
    });

    it("removes the share when the owner deletes it", async () => {
      const shareId = await seedShare(alice.id, bob.id);
      mockedAuth.mockResolvedValue(sessionFor(alice));
      const res = await DELETE(
        new NextRequest(`http://x/api/shares?id=${shareId}`, {
          method: "DELETE",
        })
      );
      expect(res.status).toBe(200);
      expect(await countShares()).toBe(0);
    });
  });
});
