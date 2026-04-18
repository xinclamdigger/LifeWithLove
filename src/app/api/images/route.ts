import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasAccess } from "@/lib/access";
import { images } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getPublicUrl } from "@/lib/r2";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId") || session.user.id;
  const date = searchParams.get("date"); // YYYY-MM-DD

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Missing or invalid date param" }, { status: 400 });
  }

  if (!(await hasAccess(userId, session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const results = await db
    .select()
    .from(images)
    .where(and(eq(images.userId, userId), eq(images.date, date)))
    .orderBy(desc(images.createdAt));

  const mapped = results.map((img) => ({
    id: img.id,
    date: img.date,
    url: getPublicUrl(img.r2Key),
    thumbnailUrl: getPublicUrl(img.thumbnailR2Key || img.r2Key),
    description: img.description,
    location: img.location,
    tags: img.tags ? JSON.parse(img.tags) : [],
    isCover: img.isCover,
    createdAt: img.createdAt,
  }));

  return NextResponse.json(mapped);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { r2Key, date, description, location, tags } = body as {
    r2Key: string;
    date: string;
    description?: string;
    location?: string;
    tags?: string[];
  };

  if (!r2Key || !date) {
    return NextResponse.json(
      { error: "Missing r2Key or date" },
      { status: 400 }
    );
  }

  const userId = session.user.id;
  const now = new Date().toISOString();

  // Unset previous cover for this user+date
  await db
    .update(images)
    .set({ isCover: false, updatedAt: now })
    .where(and(eq(images.userId, userId), eq(images.date, date), eq(images.isCover, true)));

  const id = nanoid();
  await db.insert(images).values({
    id,
    userId,
    date,
    r2Key,
    thumbnailR2Key: null,
    description: description || null,
    location: location || null,
    tags: tags ? JSON.stringify(tags) : null,
    isCover: true,
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({
    id,
    date,
    thumbnailUrl: getPublicUrl(r2Key),
  });
}
