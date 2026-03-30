import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { nanoid } from "nanoid";
import { generatePresignedUploadUrl } from "@/lib/r2";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { filename, contentType, date } = body as {
    filename: string;
    contentType: string;
    date: string; // YYYY-MM-DD
  };

  if (!filename || !contentType || !date) {
    return NextResponse.json(
      { error: "Missing filename, contentType, or date" },
      { status: 400 }
    );
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "Invalid date format, expected YYYY-MM-DD" },
      { status: 400 }
    );
  }

  const r2Key = `${session.user.id}/${date}/${nanoid()}-${filename}`;
  const uploadUrl = await generatePresignedUploadUrl(r2Key, contentType);

  return NextResponse.json({ uploadUrl, r2Key });
}
