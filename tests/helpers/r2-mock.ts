import type { Page } from "@playwright/test";

// Smallest valid PNG (1x1 transparent). Served for any image read so the
// browser can render <img> tags without real R2 access.
const ONE_PX_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64"
);

export async function mockR2(page: Page) {
  // Presigned uploads go to <account>.r2.cloudflarestorage.com. Intercept
  // the PUT so we never hit the network.
  await page.route("**/*.r2.cloudflarestorage.com/**", async (route) => {
    await route.fulfill({ status: 200 });
  });

  // Public reads hit R2_PUBLIC_URL (http://localhost:9999 in .env.test).
  await page.route("http://localhost:9999/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "image/png",
      body: ONE_PX_PNG,
    });
  });
}
