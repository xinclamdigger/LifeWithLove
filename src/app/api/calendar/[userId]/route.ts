import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAccess } from "@/lib/access";
import { parseMonthParam, getCoverImagesForMonth } from "@/lib/calendar-queries";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const [session, { userId }] = await Promise.all([auth(), params]);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await hasAccess(userId, session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const month = parseMonthParam(request.nextUrl.searchParams.get("month"));
  const result = await getCoverImagesForMonth(userId, month);
  return NextResponse.json(result);
}
