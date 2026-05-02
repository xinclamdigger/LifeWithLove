# Claude notes

Conventions and gotchas that aren't obvious from reading the code. Keep short; README has the tour.

## Workflow: test-driven development

For new features and non-trivial changes, work in this order:

1. **Integration test first** — a Playwright spec in `tests/e2e/` or a handler test in `src/app/api/**/route.test.ts` that describes the behavior end-to-end. Run it and confirm it fails for the right reason.
2. **Unit tests next** — cover the pure-logic pieces the integration test will exercise (helpers in `src/lib/**`, utility functions). Run and confirm they fail.
3. **Implement** — write the minimum code to make the failing tests pass. Don't add scope beyond what the tests require.
4. **Re-run the suite** — `npm test` and, if the feature has UI, `npm run test:e2e`. Only mark work done when everything is green.

Exceptions are fine (typo fixes, doc-only changes, exploratory spikes), but default to this order. If a test is genuinely hard to write before the code exists, say so and pair on the test design rather than skipping it.

## Commands

- `npm test` — Vitest (unit + handler tests)
- `npm run test:e2e` — Playwright (spins its own server on :3101 against `file:./test.db`)
- `npm run lint`, `npm run build` — ESLint, Next build
- `npm run dev` — Next dev server on :3000

Always run `npm test` before pushing work that touches `src/lib/**` or `src/app/api/**` — CI runs it on every push to `main` and every PR (`.github/workflows/test.yml`).

## Auth split (NextAuth v5)

Two files on purpose:

- `src/lib/auth.config.ts` — edge-safe providers only. Imported by middleware.
- `src/lib/auth.ts` — full config with the Drizzle adapter and the Node-only bits.

Don't collapse them. Middleware runs on the edge runtime and can't import the adapter.

Test auth: gated by `TEST_AUTH_ENABLED=true`, exposes a Credentials provider (id `test`) that accepts any email. Used by both Playwright (`tests/e2e/auth.setup.ts` via CSRF + callback) and locally when needed.

## Database client (`src/lib/db.ts`)

Switches driver by URL scheme:

- `file:*` → `drizzle-orm/libsql` + `@libsql/client` (Node). Used by Playwright, Vitest.
- anything else → `drizzle-orm/libsql/web` + `@libsql/client/web` (HTTP). Used in prod against Turso.

Both paths are `require()`'d lazily so the edge runtime doesn't pull in Node-only modules at parse time.

## Vitest setup

- `tests/unit/global-setup.ts` deletes `vitest.db` and applies migrations once per run.
- `tests/unit/setup.ts` sets env vars (incl. `TURSO_DATABASE_URL=file:./vitest.db`) before any import.
- `fileParallelism: false` in `vitest.config.ts` — handler tests share `vitest.db`, parallel workers cause `SQLITE_BUSY`.
- Handler test pattern: `vi.mock("@/lib/auth", () => ({ auth: vi.fn() }))`, then `vi.mocked(auth).mockResolvedValue(sessionFor(user))` per test. Helpers in `tests/unit/handler-helpers.ts` (`resetDb`, `seedUser`, `seedShare`, `seedSticker`, `sessionFor`, …).

## Playwright setup

- Two storage states: `playwright/.auth/alice.json`, `playwright/.auth/bob.json`. Fixtures in `tests/helpers/fixtures.ts`.
- Multi-user specs use `browser.newContext({ storageState })` to drive both users in one test.
- R2 is stubbed via `page.route`; DB is reset per spec (see `tests/helpers/db.ts`).
- Don't add tables to `tests/helpers/db.ts` `TABLES` unless their creation migration is on `main` — otherwise `resetDb()` fails in CI.

## Writing tests

Only test what's committed on `main`. There is ongoing local WIP (custom-stickers feature — `migrations/0003_*`, `src/app/api/custom-stickers/`, `useCustomStickers.ts`, helpers in `stickers.ts`) that is **not yet merged**. Don't import symbols from that WIP in tests, and don't reference the `custom_stickers` table — CI runs against HEAD and will fail.

## Commit hygiene

- Never `git add -A` / `git add .` — stage by path. The working tree usually carries unrelated WIP.
- Never `--no-verify`, never force-push without asking.
- Commit messages: conventional-ish (`feat:`, `fix:`, `test:`, `docs:`). Explain the *why*, not the *what*.
