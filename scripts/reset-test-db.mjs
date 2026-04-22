#!/usr/bin/env node
// Drops any existing test.db and re-applies all Drizzle migrations in order.
// Run before the Playwright test suite.

import { createClient } from "@libsql/client";
import { readFileSync, existsSync, unlinkSync, readdirSync } from "node:fs";
import { join } from "node:path";

const DB_PATH = "./test.db";
const MIGRATIONS_DIR = "./src/db/migrations";
const JOURNAL_PATH = join(MIGRATIONS_DIR, "meta/_journal.json");

if (existsSync(DB_PATH)) {
  unlinkSync(DB_PATH);
  for (const ext of ["-wal", "-shm"]) {
    const extra = DB_PATH + ext;
    if (existsSync(extra)) unlinkSync(extra);
  }
}

const journal = JSON.parse(readFileSync(JOURNAL_PATH, "utf8"));
const sqlFiles = new Set(
  readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql"))
);

const client = createClient({ url: `file:${DB_PATH}` });

for (const entry of journal.entries.sort((a, b) => a.idx - b.idx)) {
  const file = `${entry.tag}.sql`;
  if (!sqlFiles.has(file)) {
    throw new Error(`Missing migration file: ${file}`);
  }
  const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
  const statements = sql
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const stmt of statements) {
    await client.execute(stmt);
  }
  console.log(`  applied ${file} (${statements.length} stmt)`);
}

client.close();
console.log(`test.db ready at ${DB_PATH}`);
