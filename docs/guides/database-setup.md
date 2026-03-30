# Database Setup & Connection Testing

## Overview

LifeWithLove uses [Turso](https://turso.tech) (LibSQL/SQLite) as its database, accessed via the `@libsql/client/web` HTTP driver.

## Prerequisites

- A Turso account and database (free tier: 9 GB storage, 500 databases)
- Database URL and auth token

## Configuration

1. Copy `.env.example` to `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

2. Fill in the Turso credentials in `.env.local`:

   ```
   TURSO_DATABASE_URL=libsql://your-db-name.turso.io
   TURSO_AUTH_TOKEN=your-auth-token
   ```

## Applying the Schema

Run the test script to verify the connection and apply the schema:

```bash
TURSO_DATABASE_URL="libsql://your-db.turso.io" \
TURSO_AUTH_TOKEN="your-token" \
node scripts/test-db.mjs
```

Expected output:

```
Testing connection to Turso...
Connection successful: { test: 1 }

Applying schema...
  Executing: CREATE TABLE `images` ...
  Executing: CREATE INDEX `idx_images_user_date` ...
  ...

Schema applied successfully!
Tables: [ 'images', 'shares', 'users' ]
```

If the tables already exist, the script will fail with a "table already exists" error — this is expected and means the schema is already applied.

## Troubleshooting

### `URL_INVALID` error

Ensure `TURSO_DATABASE_URL` starts with `libsql://` and is correctly set.

### Native `@libsql/client` binary errors

The project uses `@libsql/client/web` (HTTP driver) instead of the native binary to avoid platform-specific dependency issues. The `drizzle-kit push` CLI command may not work due to native binary requirements — use `scripts/test-db.mjs` instead.

### Schema changes

When you modify `src/db/schema.ts`:

1. Generate a new migration:
   ```bash
   TURSO_DATABASE_URL="..." TURSO_AUTH_TOKEN="..." npx drizzle-kit generate
   ```

2. Apply it by running the corresponding SQL file through the test script or the Turso CLI.
