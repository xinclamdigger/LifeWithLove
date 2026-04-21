import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { images } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getPublicUrl } from "@/lib/r2";

let _r2: S3Client | null = null;
function getR2() {
  if (!_r2) {
    _r2 = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
    });
  }
  return _r2;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
) {
  const [session, { imageId }] = await Promise.all([auth(), params]);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const image = await db
    .select()
    .from(images)
    .where(and(eq(images.id, imageId), eq(images.userId, session.user.id)))
    .get();

  if (!image) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const now = new Date().toISOString();
  const updates: Record<string, unknown> = { updatedAt: now };

  if ("description" in body) updates.description = body.description || null;
  if ("location" in body) updates.location = body.location || null;

  let isCover = image.isCover;
  if (body.isCover === true && !image.isCover) {
    await db
      .update(images)
      .set({ isCover: false, updatedAt: now })
      .where(
        and(
          eq(images.userId, session.user.id),
          eq(images.date, image.date),
          eq(images.isCover, true)
        )
      );
    updates.isCover = true;
    isCover = true;
  }

  await db.update(images).set(updates).where(eq(images.id, imageId));

  return NextResponse.json({
    id: image.id,
    date: image.date,
    url: getPublicUrl(image.r2Key),
    thumbnailUrl: getPublicUrl(image.thumbnailR2Key || image.r2Key),
    description: updates.description ?? image.description,
    location: updates.location ?? image.location,
    tags: image.tags ? JSON.parse(image.tags) : [],
    isCover,
    createdAt: image.createdAt,
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
) {
  const [session, { imageId }] = await Promise.all([auth(), params]);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify ownership
  const image = await db
    .select()
    .from(images)
    .where(and(eq(images.id, imageId), eq(images.userId, session.user.id)))
    .get();

  if (!image) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Delete from R2
  try {
    await getR2().send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: image.r2Key,
      })
    );
  } catch {
    // Continue even if R2 delete fails — don't leave orphaned DB records
  }

  // Delete DB record
  await db.delete(images).where(eq(images.id, imageId));

  // If this was the cover, promote the most recent remaining image
  if (image.isCover) {
    const next = await db
      .select({ id: images.id })
      .from(images)
      .where(and(eq(images.userId, session.user.id), eq(images.date, image.date)))
      .orderBy(desc(images.createdAt))
      .get();

    if (next) {
      await db
        .update(images)
        .set({ isCover: true, updatedAt: new Date().toISOString() })
        .where(eq(images.id, next.id));
    }
  }

  return NextResponse.json({ success: true });
}
