import { test, expect, ALICE_EMAIL, BOB_EMAIL } from "../helpers/fixtures";
import { resetDb, seedUser } from "../helpers/db";

const ALICE_STATE = "playwright/.auth/alice.json";
const BOB_STATE = "playwright/.auth/bob.json";

test("alice shares with bob, bob views the calendar, alice revokes", async ({
  browser,
}) => {
  // The `alice` fixture isn't used here because we need both users in the DB
  // at once. Storage states from auth.setup.ts stay valid because the session
  // JWT encodes the email, and the session callback re-resolves the user id.
  await resetDb();
  const alice = await seedUser(ALICE_EMAIL, "Alice");
  await seedUser(BOB_EMAIL, "Bob");

  const aliceCtx = await browser.newContext({ storageState: ALICE_STATE });
  const bobCtx = await browser.newContext({ storageState: BOB_STATE });
  const alicePage = await aliceCtx.newPage();
  const bobPage = await bobCtx.newPage();

  try {
    // Alice shares her calendar with bob.
    await alicePage.goto("/sharing");
    await alicePage
      .getByPlaceholder(/enter email to share with/i)
      .fill(BOB_EMAIL);
    await alicePage.getByRole("button", { name: /^share$/i }).click();

    await expect(
      alicePage.getByText(`Calendar shared with ${BOB_EMAIL}`)
    ).toBeVisible();

    const bobRow = alicePage
      .locator("li")
      .filter({ hasText: BOB_EMAIL })
      .first();
    await expect(bobRow).toBeVisible();

    // Bob sees the share and can visit alice's calendar.
    await bobPage.goto("/sharing");
    const aliceShareRow = bobPage
      .locator("li")
      .filter({ hasText: "Alice's Calendar" })
      .first();
    await expect(aliceShareRow).toBeVisible();

    await bobPage.goto(`/calendar/${alice.id}`);
    await expect(bobPage).toHaveURL(new RegExp(`/calendar/${alice.id}$`));
    // No "don't have access" error — the shared calendar page mounts.
    await expect(
      bobPage.getByText(/don.?t have access to this calendar/i)
    ).toHaveCount(0);

    // Alice revokes bob's access.
    await bobRow.locator("button").click();
    await expect(bobRow).toHaveCount(0);

    // Bob now gets a forbidden view.
    await bobPage.goto(`/calendar/${alice.id}`);
    await expect(
      bobPage.getByText(/don.?t have access to this calendar/i)
    ).toBeVisible();
  } finally {
    await aliceCtx.close();
    await bobCtx.close();
  }
});
