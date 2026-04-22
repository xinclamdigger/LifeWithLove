import { test as base } from "@playwright/test";
import { resetDb, seedUser, type SeededUser } from "./db";

// Matches the emails used by auth.setup.ts so the session cookies from
// playwright/.auth/*.json map to the user rows we seed here.
export const ALICE_EMAIL = "alice@test.local";
export const BOB_EMAIL = "bob@test.local";

export const ALICE_STATE = "playwright/.auth/alice.json";
export const BOB_STATE = "playwright/.auth/bob.json";

// Each test starts with a clean DB and a freshly-seeded alice. Her session
// JWT cookie encodes her email (not her id), so the session callback will
// re-resolve the new id on every request — tests stay authenticated.
export const test = base.extend<{ alice: SeededUser }>({
  alice: async ({}, use) => {
    await resetDb();
    const alice = await seedUser(ALICE_EMAIL, "Alice");
    await use(alice);
  },
});

export { expect } from "@playwright/test";
