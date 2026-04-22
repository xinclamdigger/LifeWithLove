# Playwright Integration Testing Plan

Plan for adding end-to-end integration tests with Playwright. Not yet implemented — this document captures the intended setup and phased delivery so we can build it incrementally.

## Current state

- `@playwright/test` is already a dependency.
- No `playwright.config.ts` and no `tests/` directory yet.
- `.mcp.json` has the Playwright MCP server for interactive Claude Code use — unrelated to this plan.

## Hard problems to solve

Three things about this app make naive E2E tests unworkable. The plan addresses each.

1. **Google OAuth** — Google's login UI cannot be reliably scripted. Tests must bypass it.
2. **Turso DB state** — real remote SQLite. Tests need isolation and reset between runs.
3. **R2 uploads** — real Cloudflare bucket. Tests must not hit it.

## Decisions

| Problem | Choice | Why |
|---|---|---|
| Auth bypass | Test-only **credentials provider** in NextAuth, gated by `NODE_ENV === "test"` | ~15 lines, robust across NextAuth upgrades, easy to reason about |
| Test database | Local **libsql file** (`file:./test.db`) | Fast, offline, clean teardown is `rm test.db`. Same Drizzle schema applies |
| R2 uploads | **Playwright route mocking** (`page.route` on `/api/images/upload-url` and the PUT) | Lightest setup; upgrade to MinIO only if a test needs real upload semantics |
| Browsers | **Chromium-only** at first; add Firefox/WebKit later | Fast CI, covers 95% of real bugs |
| Run mode | Headless by default, `--headed` available locally | Standard Playwright pattern |

## Target structure

```
tests/
  e2e/
    auth.setup.ts          # seeds users, creates storageState per user
    calendar.spec.ts       # month nav, cover thumbnails visible
    upload.spec.ts         # upload → appears on calendar cell
    date-detail.spec.ts    # hero + timeline, delete
    cover-photo.spec.ts    # set-as-cover hover action
    sharing.spec.ts        # 2-user: share, view, revoke
    stickers.spec.ts       # place, drag, save
  helpers/
    db.ts                  # resetDb(), seedUser(), seedImages(), seedShare()
    fixtures.ts            # authedPage fixture, dual-user fixtures
playwright.config.ts       # webServer auto-starts next dev, baseURL, projects
.env.test                  # DATABASE_URL=file:./test.db, test AUTH_SECRET, fake R2 creds
```

## Auth pattern

1. `auth.setup.ts` runs once per test run:
   - For each test persona (e.g. `alice`, `bob`), seed a user row in the test DB.
   - `POST /api/auth/callback/credentials` with the user's email to get a session cookie.
   - Save `context.storageState()` to `playwright/.auth/alice.json`, `bob.json`.
2. Each spec declares which persona it runs as via `test.use({ storageState: "playwright/.auth/alice.json" })`.
3. Tests start pre-authenticated; no login UI interaction.

The credentials provider lives in `src/lib/auth.ts` behind `if (process.env.NODE_ENV === "test")` so it cannot be enabled in prod builds.

## Database pattern

- `.env.test` sets `DATABASE_URL=file:./test.db`.
- Drizzle migrations run against the test DB once at setup.
- `helpers/db.ts` exposes `resetDb()` that truncates `images`, `stickers`, `custom_stickers`, `shares`, `users` between tests.
- Seed helpers construct rows with deterministic IDs for assertions.

The existing lazy-init pattern in `src/lib/db.ts` is compatible — it reads env vars at first use, so pointing `next dev` at the test DB via `NODE_ENV=test` + `.env.test` is sufficient.

## R2 pattern

Every test that touches uploads includes:

```ts
await page.route("**/api/images/upload-url", (route) =>
  route.fulfill({ json: { uploadUrl: "https://fake.test/upload", r2Key: "test/fake.jpg" } })
);
await page.route("https://fake.test/upload", (route) => route.fulfill({ status: 200 }));
```

Image reads (public URLs) are either stubbed to a 1×1 pixel or the test asserts on DOM structure without waiting for the image to load.

## Phased delivery

| Phase | Deliverable | Exit criteria |
|---|---|---|
| **1 — Skeleton** | `playwright.config.ts`, test-only credentials provider, `.env.test`, `resetDb()`, one smoke test (`calendar.spec.ts`: login → calendar renders) | `npx playwright test` passes locally |
| **2 — Core features** | `upload.spec.ts`, `date-detail.spec.ts`, `cover-photo.spec.ts` with route-mocked R2 | Covers features we actively touch |
| **3 — Sharing** | `sharing.spec.ts` with two storage states (owner + recipient) | Share → view → revoke tested end-to-end |
| **4 — Stickers + CI** | `stickers.spec.ts`, GitHub Actions workflow with cached browser binaries, failure artifacts uploaded | Green CI on PRs |

## CI outline

- GitHub Actions workflow on PR + push to main.
- Cache `~/.cache/ms-playwright` keyed on Playwright version.
- Run `npm ci`, `npx playwright install --with-deps chromium`, `npx playwright test`.
- On failure, upload `playwright-report/` as artifact.

## Open questions deferred to implementation

- Does the test-only credentials provider need CSRF-token handling, or does NextAuth's credentials flow handle it transparently?
- If `file:` libsql surfaces any behavior differences from Turso remote (e.g., HTTP driver quirks), we may need to revisit — a test Turso DB is the fallback.
- Sticker tests involve drag gestures — Playwright's `dragTo` may need per-step `mouse.move` calls to match the real pointerdown/move/up flow.
