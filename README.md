# LifeWithLove

A shared photo calendar — one image per day, decorated with stickers, shareable with the people you love.

Upload a photo to any date, pick a cover when you have multiple, tell the story in a timeline view, drop stickers onto the month grid, and share your calendar with a partner so they can see (and decorate) it too.

## Tech stack

- **Framework** — Next.js 16 (App Router, Turbopack), React 19
- **Auth** — NextAuth v5 with Google OAuth
- **Database** — Turso (libSQL/SQLite) via Drizzle ORM
- **Storage** — Cloudflare R2 with presigned URLs (AWS S3 SDK)
- **UI** — Tailwind CSS v4, shadcn/ui, Base UI, Lucide icons, Sonner toasts
- **Testing** — Playwright (e2e) against a local libSQL `file:` DB
- **CI** — GitHub Actions

## Quick start

```bash
npm install
npm run dev            # http://localhost:3000
```

Environment setup (Google OAuth, Turso, R2) is documented in [docs/guides/local-development.md](docs/guides/local-development.md) and [docs/guides/database-setup.md](docs/guides/database-setup.md).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint |
| `npm run test:e2e` | Run the Playwright suite (spins up a test server on port 3101) |
| `npm run test:e2e:ui` | Playwright in UI mode |

## Testing

The e2e suite covers calendar / upload / date-detail / cover-photo / sharing / stickers. It runs against a local `file:./test.db` seeded fresh per test, stubs Cloudflare R2 with `page.route`, and bypasses Google OAuth via a gated `TEST_AUTH_ENABLED` credentials provider. See [docs/guides/playwright-testing-plan.md](docs/guides/playwright-testing-plan.md).

CI runs the same suite on every pull request and push to `main` (`.github/workflows/e2e.yml`).

## Project layout

```
src/
  app/              Next.js App Router routes (calendar, date detail, upload, sharing, login)
  app/api/          API route handlers (images, shares, stickers, calendar, auth)
  components/       UI components (calendar grid, stickers overlay, layout)
  db/               Drizzle schema + migrations
  lib/              auth, db client, R2 helpers, access control
docs/
  guides/           Local dev, database, testing guides
  product/          Product requirements and feature specs
tests/
  e2e/              Playwright specs
  helpers/          Test DB + fixtures + R2 mock
```

## Docs

- [Product requirements](docs/product/P0_requirements.md)
- [Cover photo selection spec](docs/product/cover_photo_selection.md)
- [Local development guide](docs/guides/local-development.md)
- [Database setup](docs/guides/database-setup.md)
- [Playwright testing plan](docs/guides/playwright-testing-plan.md)

## Changelog

See [CHANGELOG.md](CHANGELOG.md).
