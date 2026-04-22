import { test, expect } from "../helpers/fixtures";
import { mockR2 } from "../helpers/r2-mock";
import { seedImage } from "../helpers/db";

const DATE = "2026-04-15";

test("renders hero + timeline and can delete a photo", async ({
  page,
  alice,
}) => {
  await mockR2(page);

  await seedImage(alice.id, {
    date: DATE,
    isCover: true,
    description: "Hero shot",
  });
  const timelineImg = await seedImage(alice.id, {
    date: DATE,
    isCover: false,
    description: "Timeline shot",
  });

  await page.goto(`/date/${DATE}`);

  await expect(page.getByText("Cover", { exact: true })).toBeVisible();
  await expect(page.getByText("Hero shot")).toBeVisible();
  await expect(page.getByText("Timeline shot")).toBeVisible();

  // Delete the timeline image via its hover delete button. The timeline item
  // is the card that contains the timeline caption.
  const timelineCard = page
    .locator("div", { has: page.getByText("Timeline shot") })
    .filter({ has: page.locator("button[title='Set as cover']") })
    .first();

  // Force-click the hover-only delete (opacity transitions don't block clicks
  // in Playwright, but we scope inside the card to disambiguate).
  await timelineCard
    .locator("button")
    .filter({ has: page.locator("svg") })
    .last()
    .click();

  await expect(page.getByText("Timeline shot")).toHaveCount(0);
  await expect(page.getByText("Hero shot")).toBeVisible();

  // DB should reflect the delete.
  const res = await page.request.get(`/api/images?date=${DATE}`);
  expect(res.ok()).toBeTruthy();
  const images = (await res.json()) as Array<{ id: string }>;
  expect(images.map((i) => i.id)).not.toContain(timelineImg.id);
  expect(images.length).toBe(1);
});
