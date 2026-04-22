import { test, expect } from "../helpers/fixtures";

test("authenticated user lands on calendar with month grid", async ({
  page,
  alice: _alice,
}) => {
  await page.goto("/calendar");

  await expect(page).toHaveURL(/\/calendar/);
  for (const day of ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]) {
    await expect(page.getByText(day, { exact: true }).first()).toBeVisible();
  }
});
