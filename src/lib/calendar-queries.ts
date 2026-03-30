import { format, addMonths } from "date-fns";
import { db } from "@/lib/db";
import { images } from "@/db/schema";
import { eq, and, gte, lt } from "drizzle-orm";
import { getPublicUrl } from "@/lib/r2";

export function parseMonthParam(param: string | null): string {
  if (param && /^\d{4}-\d{2}$/.test(param)) return param;
  return format(new Date(), "yyyy-MM");
}

export async function getCoverImagesForMonth(userId: string, month: string) {
  const startDate = `${month}-01`;
  const endDate = format(addMonths(new Date(startDate), 1), "yyyy-MM-dd");

  const coverImages = await db
    .select({
      id: images.id,
      date: images.date,
      r2Key: images.r2Key,
      thumbnailR2Key: images.thumbnailR2Key,
    })
    .from(images)
    .where(
      and(
        eq(images.userId, userId),
        gte(images.date, startDate),
        lt(images.date, endDate),
        eq(images.isCover, true)
      )
    );

  return coverImages.map((img) => ({
    date: img.date,
    imageId: img.id,
    thumbnailUrl: getPublicUrl(img.thumbnailR2Key || img.r2Key),
  }));
}
