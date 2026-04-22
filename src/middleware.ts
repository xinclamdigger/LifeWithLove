import NextAuth from "next-auth";
import authConfig from "@/lib/auth.config";

// Use the edge-safe auth config (no DB access) so middleware can run in the
// Edge Runtime. The full auth instance with DB callbacks lives in lib/auth.ts.
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: [
    // Protect all routes except auth, api/auth, static files, and public assets
    "/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)",
  ],
};
