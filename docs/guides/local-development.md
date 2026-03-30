# Local Development Guide

## Prerequisites

- Node.js (v18+)
- npm
- Google OAuth credentials (see below)
- Turso database (see [database-setup.md](database-setup.md))

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment template and fill in your credentials:

   ```bash
   cp .env.example .env.local
   ```

   Required variables:

   | Variable | Description | How to get it |
   |----------|-------------|---------------|
   | `GOOGLE_CLIENT_ID` | Google OAuth client ID | Google Cloud Console → APIs & Services → Clients |
   | `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Same as above |
   | `AUTH_SECRET` | Random secret for NextAuth sessions | Run `openssl rand -base64 32` |
   | `TURSO_DATABASE_URL` | Turso database URL | Turso dashboard or CLI |
   | `TURSO_AUTH_TOKEN` | Turso auth token | Turso dashboard or CLI |

3. Apply the database schema (if not already done):

   ```bash
   TURSO_DATABASE_URL="your-url" TURSO_AUTH_TOKEN="your-token" node scripts/test-db.mjs
   ```

## Running the Dev Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

- Visiting `/` redirects to `/calendar`
- Unauthenticated users are redirected to `/login`
- Sign in with Google to access the app

## Building for Production

```bash
npm run build
```

This creates an optimized production build in the `.next/` directory.

To run the production build locally:

```bash
npm run build && npm start
```

The production server runs on `http://localhost:3000` by default.

## Linting

```bash
npm run lint
```

## Testing with Playwright

Playwright is set up for browser-based E2E testing.

### Install browser binaries (first time only):

```bash
npx playwright install chromium
```

### Run tests:

```bash
npx playwright test
```

### Run tests with a visible browser:

```bash
npx playwright test --headed
```

### Playwright MCP Server

A Playwright MCP server is configured in `.mcp.json` for use with Claude Code. After restarting Claude Code, it can launch a browser and interact with the app directly for testing.

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Navigate to **Google Auth Platform → Overview** and click **Get started**
4. Fill in app name ("LifeWithLove"), support email, and select **External** audience
5. Go to **Clients** → **Create OAuth client**
6. Select **Web application**, name it "LifeWithLove Web"
7. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
8. Copy the Client ID and Client Secret into `.env.local`

## Project Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (with Turbopack) |
| `npm run build` | Create production build |
| `npm start` | Run production server |
| `npm run lint` | Run ESLint |
