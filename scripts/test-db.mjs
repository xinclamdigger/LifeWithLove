import { createClient } from "@libsql/client/web";
import { readFileSync } from "fs";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Test connection
console.log("Testing connection to Turso...");
const result = await client.execute("SELECT 1 as test");
console.log("Connection successful:", result.rows[0]);

// Apply migration
console.log("\nApplying schema...");
const migrationSql = readFileSync(
  "src/db/migrations/0000_previous_emma_frost.sql",
  "utf-8"
);

// Split by statement-breakpoint and execute each statement
const statements = migrationSql
  .split("--> statement-breakpoint")
  .map((s) => s.trim())
  .filter(Boolean);

for (const stmt of statements) {
  console.log(`  Executing: ${stmt.substring(0, 60)}...`);
  await client.execute(stmt);
}

console.log("\nSchema applied successfully!");

// Verify tables
const tables = await client.execute(
  "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
);
console.log(
  "Tables:",
  tables.rows.map((r) => r.name)
);

client.close();
