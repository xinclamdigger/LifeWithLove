import "@testing-library/jest-dom/vitest";

// Stub env vars BEFORE any src/* module imports so src/lib/db.ts picks
// up the file: URL and src/lib/r2.ts has something to read.
process.env.TURSO_DATABASE_URL = "file:./vitest.db";
process.env.TEST_AUTH_ENABLED = "true";
process.env.AUTH_SECRET = "test-secret-for-vitest-only";
process.env.AUTH_TRUST_HOST = "true";
process.env.GOOGLE_CLIENT_ID = "test-unused";
process.env.GOOGLE_CLIENT_SECRET = "test-unused";
process.env.R2_ACCOUNT_ID = "test";
process.env.R2_ACCESS_KEY_ID = "test";
process.env.R2_SECRET_ACCESS_KEY = "test";
process.env.R2_BUCKET_NAME = "test";
process.env.R2_PUBLIC_URL = "http://localhost:9999";
