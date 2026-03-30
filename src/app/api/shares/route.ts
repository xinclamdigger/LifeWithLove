import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { shares, users } from "@/db/schema";
import { eq, and, or } from "drizzle-orm";

// GET /api/shares — list shares (by me + with me)
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const allShares = await db
    .select({
      id: shares.id,
      ownerId: shares.ownerId,
      sharedWithId: shares.sharedWithId,
      createdAt: shares.createdAt,
      ownerName: users.name,
      ownerEmail: users.email,
      ownerAvatar: users.avatarUrl,
    })
    .from(shares)
    .innerJoin(users, eq(users.id, shares.ownerId))
    .where(or(eq(shares.ownerId, userId), eq(shares.sharedWithId, userId)));

  // Split into two lists and enrich with user info
  const sharedByMe: typeof allShares = [];
  const sharedWithMe: typeof allShares = [];

  for (const share of allShares) {
    if (share.ownerId === userId) {
      sharedByMe.push(share);
    } else {
      sharedWithMe.push(share);
    }
  }

  // For sharedByMe, we need the sharedWith user info instead of owner info
  // Do a second query for those user IDs
  const sharedWithUserIds = sharedByMe.map((s) => s.sharedWithId);
  let sharedWithUsers: { id: string; name: string; email: string; avatarUrl: string | null }[] = [];

  if (sharedWithUserIds.length > 0) {
    sharedWithUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(
        or(...sharedWithUserIds.map((uid) => eq(users.id, uid)))!
      );
  }

  const userMap = new Map(sharedWithUsers.map((u) => [u.id, u]));

  return NextResponse.json({
    sharedByMe: sharedByMe.map((s) => {
      const user = userMap.get(s.sharedWithId);
      return {
        id: s.id,
        sharedWithId: s.sharedWithId,
        sharedWithName: user?.name ?? "Unknown",
        sharedWithEmail: user?.email ?? "",
        sharedWithAvatar: user?.avatarUrl ?? null,
        createdAt: s.createdAt,
      };
    }),
    sharedWithMe: sharedWithMe.map((s) => ({
      id: s.id,
      ownerId: s.ownerId,
      ownerName: s.ownerName,
      ownerEmail: s.ownerEmail,
      ownerAvatar: s.ownerAvatar,
      createdAt: s.createdAt,
    })),
  });
}

// POST /api/shares — share calendar with user by email
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email } = await request.json();
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const ownerId = session.user.id;

  // Can't share with yourself
  if (email === session.user.email) {
    return NextResponse.json(
      { error: "You can't share with yourself" },
      { status: 400 }
    );
  }

  // Find the user by email
  const targetUser = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.email, email))
    .get();

  if (!targetUser) {
    return NextResponse.json(
      { error: "No user found with that email. They need to sign up first." },
      { status: 404 }
    );
  }

  // Check if already shared
  const existing = await db
    .select({ id: shares.id })
    .from(shares)
    .where(
      and(eq(shares.ownerId, ownerId), eq(shares.sharedWithId, targetUser.id))
    )
    .get();

  if (existing) {
    return NextResponse.json(
      { error: "Calendar already shared with this user" },
      { status: 409 }
    );
  }

  const now = new Date().toISOString();
  const shareId = nanoid();

  await db.insert(shares).values({
    id: shareId,
    ownerId,
    sharedWithId: targetUser.id,
    createdAt: now,
  });

  return NextResponse.json({
    id: shareId,
    sharedWithId: targetUser.id,
    sharedWithName: targetUser.name,
    sharedWithEmail: targetUser.email,
  });
}

// DELETE /api/shares?id=X — revoke a share
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const shareId = request.nextUrl.searchParams.get("id");
  if (!shareId) {
    return NextResponse.json({ error: "Share ID required" }, { status: 400 });
  }

  // Verify ownership
  const share = await db
    .select({ id: shares.id, ownerId: shares.ownerId })
    .from(shares)
    .where(eq(shares.id, shareId))
    .get();

  if (!share) {
    return NextResponse.json({ error: "Share not found" }, { status: 404 });
  }

  if (share.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.delete(shares).where(eq(shares.id, shareId));

  return NextResponse.json({ success: true });
}
