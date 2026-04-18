import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasAccess } from "@/lib/access";
import { stickers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const calendarUserId = searchParams.get("calendarUserId") || session.user.id;
  const month = searchParams.get("month");

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json(
      { error: "Missing or invalid month param (YYYY-MM)" },
      { status: 400 }
    );
  }

  if (!(await hasAccess(calendarUserId, session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const results = await db
    .select()
    .from(stickers)
    .where(
      and(
        eq(stickers.calendarUserId, calendarUserId),
        eq(stickers.month, month)
      )
    );

  return NextResponse.json(results);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { calendarUserId, month, stickerType, xPercent, yPercent } = body as {
    calendarUserId: string;
    month: string;
    stickerType: string;
    xPercent: number;
    yPercent: number;
  };

  if (!calendarUserId || !month || !stickerType || xPercent == null || yPercent == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!(await hasAccess(calendarUserId, session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = nanoid();
  const now = new Date().toISOString();

  const sticker = {
    id,
    userId: session.user.id,
    calendarUserId,
    month,
    stickerType,
    xPercent: Math.round(Math.max(0, Math.min(10000, xPercent))),
    yPercent: Math.round(Math.max(0, Math.min(10000, yPercent))),
    scale: 100,
    rotation: 0,
    zIndex: 0,
    createdAt: now,
  };

  await db.insert(stickers).values(sticker);

  return NextResponse.json(sticker);
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, xPercent, yPercent, scale, rotation, zIndex } = body as {
    id: string;
    xPercent?: number;
    yPercent?: number;
    scale?: number;
    rotation?: number;
    zIndex?: number;
  };

  if (!id) {
    return NextResponse.json({ error: "Missing sticker id" }, { status: 400 });
  }

  // Only the sticker owner can update
  const existing = await db
    .select()
    .from(stickers)
    .where(eq(stickers.id, id))
    .get();

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updates: Record<string, number> = {};
  if (xPercent != null) updates.xPercent = Math.round(Math.max(0, Math.min(10000, xPercent)));
  if (yPercent != null) updates.yPercent = Math.round(Math.max(0, Math.min(10000, yPercent)));
  if (scale != null) updates.scale = Math.round(Math.max(30, Math.min(300, scale)));
  if (rotation != null) updates.rotation = ((Math.round(rotation) % 360) + 360) % 360;
  if (zIndex != null) updates.zIndex = zIndex;

  await db.update(stickers).set(updates).where(eq(stickers.id, id));

  return NextResponse.json({ ...existing, ...updates });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing sticker id" }, { status: 400 });
  }

  const existing = await db
    .select()
    .from(stickers)
    .where(eq(stickers.id, id))
    .get();

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.delete(stickers).where(eq(stickers.id, id));

  return NextResponse.json({ success: true });
}
