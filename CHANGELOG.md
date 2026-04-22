# Changelog

All notable changes to this project are documented in this file. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); the project hasn't tagged a release yet, so entries are grouped by the date they landed on `main`.

## [Unreleased]

### Added — 2026-04-21 · e2e test suite + CI

- Playwright end-to-end suite covering: calendar smoke, upload round-trip, date detail hero + timeline + delete, cover photo promotion, alice↔bob sharing with revoke, and sticker CRUD + cross-user access control (9 tests).
- Test-only auth bypass via a gated credentials provider (`TEST_AUTH_ENABLED=true`), and `page.route` stubs for Cloudflare R2 so no external calls happen in tests.
- Local test DB on libSQL `file:./test.db` seeded fresh per test, with migrations applied by `scripts/reset-test-db.mjs`.
- GitHub Actions workflow (`.github/workflows/e2e.yml`) runs the suite on every pull request and push to `main`.

### Changed — 2026-04-21

- Auth split into an edge-safe config (`src/lib/auth.config.ts`) used by middleware and a full-featured module (`src/lib/auth.ts`) used by routes, so the middleware can run in the Edge Runtime.
- `src/lib/db.ts` now selects the native libSQL driver for `file:` URLs and the HTTP driver for Turso remote URLs, enabling local-file DBs in tests without changing production behavior.

### Added — 2026-04-20 · Manual cover photo selection

- Hover "Set as cover" button on timeline photos in the date detail view (owner-only).
- `PATCH /api/images/[imageId]` now accepts `isCover: true` and atomically promotes the target while unsetting the previous cover.
- Existing auto-cover-on-upload and promote-on-delete fallbacks preserved. See [docs/product/cover_photo_selection.md](docs/product/cover_photo_selection.md).

### Added — 2026-04-17 · Interactive sticker system

- Collapsible sticker panel with 10 built-in Twemoji SVG assets (heart, sparkle, star, rainbow, kiss, flower, cake, sun, moon, camera).
- Drag-and-drop or tap-to-place onto the month grid; reposition, resize, rotate, and delete placed stickers.
- Stickers scoped per month, visible to shared partners, with optimistic updates and debounced persistence.
- Shared `hasAccess` utility extracted from duplicated auth checks.

### Added — 2026-03-30 · Date detail timeline, richer calendar cells, warmer empty states

- Date detail page redesigned as a storytelling timeline: hero cover image with gradient overlay, vertical rose line/dots for remaining photos, inline caption editing, and an inline drag-and-drop upload zone.
- `PATCH` endpoint for updating image description/location; static preview at `/date/preview` for demo.
- Calendar cells gained gradient overlays, hover scale-up with shadow, a plus-icon on empty hover, photo-count badges, and a rose glow for today.
- First-time onboarding card, empty-month banner with "Add a photo" link, warmer date-detail empty state, and a month progress bar.

### Added — 2026-03-29 · Core app

- Google OAuth via NextAuth with Turso-backed sessions.
- Calendar monthly grid view and date detail pages.
- Image upload flow using Cloudflare R2 presigned URLs.
- Calendar sharing between users (share, view, revoke).
- App shell with sidebar navigation, user menu, and shadcn/ui components.
- Drizzle ORM schema and initial migrations.

[Unreleased]: https://github.com/xinclamdigger/LifeWithLove/commits/main
