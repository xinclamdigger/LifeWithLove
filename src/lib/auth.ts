import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!account || account.provider !== "google") return false;

      const googleId = account.providerAccountId;
      const email = user.email!;
      const name = user.name || email;
      const avatarUrl = user.image || null;
      const now = new Date().toISOString();

      // Upsert user
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
