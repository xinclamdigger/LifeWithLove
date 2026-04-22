import { test as setup, expect, type BrowserContext } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resetDb, seedUser } from "../helpers/db";
import {
  ALICE_EMAIL,
  ALICE_STATE,
  BOB_EMAIL,
  BOB_STATE,
} from "../helpers/fixtures";

async function signInAndSave(
  context: BrowserContext,
  email: string,
  statePath: string
) {
  const page = await context.newPage();

  const csrfRes = await page.request.get("/api/auth/csrf");
  expect(csrfRes.ok()).toBeTruthy();
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };

  const callbackRes = await page.request.post("/api/auth/callback/test", {
    form: {
      csrfToken,
      email,
      callbackUrl: "/",
      json: "true",
    },
  });
  expect(callbackRes.ok()).toBeTruthy();

  await page.goto("/calendar");
  await expect(page).toHaveURL(/\/calendar/);

  await context.storageState({ path: statePath });
  await page.close();
}

setup("authenticate as alice and bob", async ({ browser }) => {
  await resetDb();
  await seedUser(ALICE_EMAIL, "Alice");
  await seedUser(BOB_EMAIL, "Bob");
  mkdirSync("playwright/.auth", { recursive: true });

  const aliceCtx = await browser.newContext();
  await signInAndSave(aliceCtx, ALICE_EMAIL, ALICE_STATE);
  await aliceCtx.close();

  const bobCtx = await browser.newContext();
  await signInAndSave(bobCtx, BOB_EMAIL, BOB_STATE);
  await bobCtx.close();
});
