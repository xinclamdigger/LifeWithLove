import { createRequire } from "node:module";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "@/db/schema";

const require = createRequire(import.meta.url);

type Db = LibSQLDatabase<typeof schema>;

let _db: Db | null = null;

function init(): Db {
  const url = process.env.TURSO_DATABASE_URL!;

  if (url.startsWith("file:")) {
    const { drizzle } = require("drizzle-orm/libsql");
    const { createClient } = require("@libsql/client");
    return drizzle(createClient({ url }), { schema });
  }

  const { drizzle } = require("drizzle-orm/libsql/web");
  const { createClient } = require("@libsql/client/web");
  return drizzle(
    createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN }),
    { schema }
  );
}

export function getDb(): Db {
  if (!_db) _db = init();
  return _db;
}

export const db = new Proxy({} as Db, {
  get(_target, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
