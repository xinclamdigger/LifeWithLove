import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { parseMonthParam, getCoverImagesForMonth } from "@/lib/calendar-queries";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const month = parseMonthParam(request.nextUrl.searchParams.get("month"));
  const result = await getCoverImagesForMonth(session.user.id, month);
  return NextResponse.json(result);
}
