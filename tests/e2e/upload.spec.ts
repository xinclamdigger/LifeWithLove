import { test, expect } from "../helpers/fixtures";
import { mockR2 } from "../helpers/r2-mock";
import { format } from "date-fns";

const ONE_PX_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64"
);

test("user uploads a photo and lands on that date's detail view", async ({
  page,
  alice: _alice,
}) => {
  await mockR2(page);

  const today = format(new Date(), "yyyy-MM-dd");
  await page.goto(`/upload?date=${today}`);

  await page
    .locator('input[type="file"]')
    .setInputFiles({
      name: "test.png",
      mimeType: "image/png",
      buffer: ONE_PX_PNG,
    });

  await page.getByRole("button", { name: /upload to calendar/i }).click();

  await expect(page).toHaveURL(new RegExp(`/date/${today}$`));

  // Hero image rendered on the date detail view.
  const hero = page.locator("img").first();
  await expect(hero).toBeVisible();
  await expect(page.getByText("Cover", { exact: true })).toBeVisible();
});
