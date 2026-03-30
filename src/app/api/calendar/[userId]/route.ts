import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { shares } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { parseMonthParam, getCoverImagesForMonth } from "@/lib/calendar-queries";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const [session, { userId }] = await Promise.all([auth(), params]);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requesterId = session.user.id;

  if (requesterId !== userId) {
    const share = await db
      .select({ id: shares.id })
      .from(shares)
      .where(
        and(eq(shares.ownerId, userId), eq(shares.sharedWithId, requesterId))
      )
      .get();

    if (!share) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const month = parseMonthParam(request.nextUrl.searchParams.get("month"));
  const result = await getCoverImagesForMonth(userId, month);
  return NextResponse.json(result);
}
