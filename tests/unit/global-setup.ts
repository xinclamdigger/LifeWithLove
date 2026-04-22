import { createClient } from "@libsql/client";
import { readFileSync, existsSync, unlinkSync, readdirSync } from "node:fs";
import { join } from "node:path";

const DB_PATH = "./vitest.db";
const MIGRATIONS_DIR = "./src/db/migrations";
const JOURNAL_PATH = join(MIGRATIONS_DIR, "meta/_journal.json");

export async function setup() {
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
  const sorted = [...journal.entries].sort(
    (a: { idx: number }, b: { idx: number }) => a.idx - b.idx
  );

  for (const entry of sorted) {
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
  }

  client.close();
}

export async function teardown() {
  // Leave vitest.db in place so developers can inspect the last run.
}
