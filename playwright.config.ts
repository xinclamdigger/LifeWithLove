import { defineConfig, devices } from "@playwright/test";

const PORT = 3101;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",

  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/alice.json",
      },
      dependencies: ["setup"],
    },
  ],

  webServer: {
    command: "node scripts/reset-test-db.mjs && npx next dev -p " + PORT,
    url: `${BASE_URL}/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      NODE_ENV: "test",
      TURSO_DATABASE_URL: "file:./test.db",
      TEST_AUTH_ENABLED: "true",
      AUTH_SECRET: "test-secret-not-for-production-use-only",
      AUTH_TRUST_HOST: "true",
      GOOGLE_CLIENT_ID: "test-unused",
      GOOGLE_CLIENT_SECRET: "test-unused",
      R2_ACCOUNT_ID: "test",
      R2_ACCESS_KEY_ID: "test",
      R2_SECRET_ACCESS_KEY: "test",
      R2_BUCKET_NAME: "test",
      R2_PUBLIC_URL: "http://localhost:9999",
    },
  },
});
