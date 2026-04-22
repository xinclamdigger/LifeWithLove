import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

const testAuthEnabled = process.env.TEST_AUTH_ENABLED === "true";

export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    ...(testAuthEnabled
      ? [
          Credentials({
            id: "test",
            name: "Test",
            credentials: { email: { type: "text" } },
            async authorize(credentials) {
              const email =
                typeof credentials?.email === "string"
                  ? credentials.email
                  : null;
              if (!email) return null;
              return { id: email, email, name: email };
            },
          }),
        ]
      : []),
  ],
} satisfies NextAuthConfig;
