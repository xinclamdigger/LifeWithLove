import { test, expect, ALICE_EMAIL, BOB_EMAIL } from "../helpers/fixtures";
import { resetDb, seedUser } from "../helpers/db";
import { format } from "date-fns";

const ALICE_STATE = "playwright/.auth/alice.json";
const BOB_STATE = "playwright/.auth/bob.json";

test("owner can create, list, and delete a sticker via API", async ({
  page,
  alice,
}) => {
  const month = format(new Date(), "yyyy-MM");

  // Empty to start.
  const emptyRes = await page.request.get(
    `/api/stickers?calendarUserId=${alice.id}&month=${month}`
  );
  expect(emptyRes.ok()).toBeTruthy();
  expect(await emptyRes.json()).toEqual([]);

  // Create.
  const createRes = await page.request.post("/api/stickers", {
    data: {
      calendarUserId: alice.id,
      month,
      stickerType: "heart",
      xPercent: 4200,
      yPercent: 3800,
    },
  });
  expect(createRes.ok()).toBeTruthy();
  const created = await createRes.json();
  expect(created.stickerType).toBe("heart");
  expect(created.userId).toBe(alice.id);

  // List.
  const listRes = await page.request.get(
    `/api/stickers?calendarUserId=${alice.id}&month=${month}`
  );
  const list = (await listRes.json()) as Array<{ id: string }>;
  expect(list.map((s) => s.id)).toContain(created.id);

  // Delete.
  const delRes = await page.request.delete(`/api/stickers?id=${created.id}`);
  expect(delRes.ok()).toBeTruthy();

  const afterRes = await page.request.get(
    `/api/stickers?calendarUserId=${alice.id}&month=${month}`
  );
  expect(await afterRes.json()).toEqual([]);
});

test("sticker panel opens and renders the catalog", async ({
  page,
  alice: _alice,
}) => {
  await page.goto("/calendar");
  await page.getByTitle("Open sticker panel").click();
  await expect(page.getByTitle("Heart")).toBeVisible();
  await expect(page.getByTitle("Star")).toBeVisible();
  await expect(page.getByTitle("Sparkles")).toBeVisible();
});

test("sticker access control: outsider forbidden, collaborator allowed, owner-only delete", async ({
  browser,
}) => {
  await resetDb();
  const alice = await seedUser(ALICE_EMAIL, "Alice");
  await seedUser(BOB_EMAIL, "Bob");
  const month = format(new Date(), "yyyy-MM");

  const aliceCtx = await browser.newContext({ storageState: ALICE_STATE });
  const bobCtx = await browser.newContext({ storageState: BOB_STATE });
  const alicePage = await aliceCtx.newPage();
  const bobPage = await bobCtx.newPage();

  try {
    // Bob has no access — GET and POST are both 403.
    const bobGetUnshared = await bobPage.request.get(
      `/api/stickers?calendarUserId=${alice.id}&month=${month}`
    );
    expect(bobGetUnshared.status()).toBe(403);

    const bobPostUnshared = await bobPage.request.post("/api/stickers", {
      data: {
        calendarUserId: alice.id,
        month,
        stickerType: "heart",
        xPercent: 5000,
        yPercent: 5000,
      },
    });
    expect(bobPostUnshared.status()).toBe(403);

    // Alice shares with bob.
    const shareRes = await alicePage.request.post("/api/shares", {
      data: { email: BOB_EMAIL },
    });
    expect(shareRes.ok()).toBeTruthy();

    // Bob can now view alice's stickers and add his own.
    const bobGet = await bobPage.request.get(
      `/api/stickers?calendarUserId=${alice.id}&month=${month}`
    );
    expect(bobGet.ok()).toBeTruthy();

    const bobSticker = await (
      await bobPage.request.post("/api/stickers", {
        data: {
          calendarUserId: alice.id,
          month,
          stickerType: "star",
          xPercent: 2000,
          yPercent: 2000,
        },
      })
    ).json();
    expect(bobSticker.id).toBeTruthy();

    // Alice cannot delete bob's sticker even though it's on her calendar.
    const aliceDel = await alicePage.request.delete(
      `/api/stickers?id=${bobSticker.id}`
    );
    expect(aliceDel.status()).toBe(403);

    // Bob can delete his own.
    const bobDel = await bobPage.request.delete(
      `/api/stickers?id=${bobSticker.id}`
    );
    expect(bobDel.ok()).toBeTruthy();
  } finally {
    await aliceCtx.close();
    await bobCtx.close();
  }
});
