import { test, expect } from "../helpers/fixtures";
import { mockR2 } from "../helpers/r2-mock";
import { seedImage, getImageById } from "../helpers/db";

const DATE = "2026-04-10";

test("owner can promote a timeline photo to cover", async ({
  page,
  alice,
}) => {
  await mockR2(page);

  const originalCover = await seedImage(alice.id, {
    date: DATE,
    isCover: true,
    description: "Original cover",
  });
  const candidate = await seedImage(alice.id, {
    date: DATE,
    isCover: false,
    description: "New cover candidate",
  });

  await page.goto(`/date/${DATE}`);

  await expect(page.getByText("Original cover")).toBeVisible();
  await expect(page.getByText("New cover candidate")).toBeVisible();

  // Click the "Set as cover" button on the timeline item (the candidate). The
  // button is owner-only, only rendered on non-cover timeline items.
  await page.locator('button[title="Set as cover"]').click();

  // Toast confirms, hero swaps — the candidate description should now be
  // under the Cover badge.
  await expect(page.getByText(/cover photo updated/i)).toBeVisible();

  // DB: isCover flags have been swapped atomically.
  const newCover = await getImageById(candidate.id);
  const demoted = await getImageById(originalCover.id);
  expect(newCover?.isCover).toBe(true);
  expect(demoted?.isCover).toBe(false);

  // After reload, the cover is persisted.
  await page.reload();
  await expect(page.getByText("Cover", { exact: true })).toBeVisible();
  // The promoted image is now the hero (first img on the page).
  const apiRes = await page.request.get(`/api/images?date=${DATE}`);
  const images = (await apiRes.json()) as Array<{
    id: string;
    isCover: boolean;
  }>;
  expect(images.find((i) => i.isCover)?.id).toBe(candidate.id);
});
