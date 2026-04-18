import { db } from "@/lib/db";
import { shares } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/** Check if sessionUserId is the owner or has share access to resourceOwnerId's calendar. */
export async function hasAccess(
  resourceOwnerId: string,
  sessionUserId: string
): Promise<boolean> {
  if (resourceOwnerId === sessionUserId) return true;
  const share = await db
    .select({ id: shares.id })
    .from(shares)
    .where(
      and(
        eq(shares.ownerId, resourceOwnerId),
        eq(shares.sharedWithId, sessionUserId)
      )
    )
    .get();
  return !!share;
}
