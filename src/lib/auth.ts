import NextAuth from "next-auth";
import authConfig from "@/lib/auth.config";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

const testAuthEnabled = process.env.TEST_AUTH_ENABLED === "true";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  callbacks: {
    async signIn({ user, account }) {
      if (!account) return false;

      const now = new Date().toISOString();

      if (account.provider === "google") {
        const googleId = account.providerAccountId;
        const email = user.email!;
        const name = user.name || email;
        const avatarUrl = user.image || null;

        const existing = await db
          .select()
          .from(users)
          .where(eq(users.googleId, googleId))
          .get();

        if (existing) {
          await db
            .update(users)
            .set({ name, avatarUrl, updatedAt: now })
            .where(eq(users.id, existing.id));
        } else {
          await db.insert(users).values({
            id: nanoid(),
            googleId,
            email,
            name,
            avatarUrl,
            createdAt: now,
            updatedAt: now,
          });
        }
        return true;
      }

      if (testAuthEnabled && account.provider === "test") {
        const email = user.email!;
        const existing = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .get();

        if (!existing) {
          await db.insert(users).values({
            id: nanoid(),
            googleId: `test:${email}`,
            email,
            name: user.name || email,
            avatarUrl: null,
            createdAt: now,
            updatedAt: now,
          });
        }
        return true;
      }

      return false;
    },
    async session({ session }) {
      // Attach our internal user ID to the session
      if (session.user?.email) {
        const dbUser = await db
          .select()
          .from(users)
          .where(eq(users.email, session.user.email))
          .get();

        if (dbUser) {
          session.user.id = dbUser.id;
        }
      }
      return session;
    },
  },
});
