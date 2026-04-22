import { createClient, type Client } from "@libsql/client";
import { nanoid } from "nanoid";

const TABLES = ["images", "stickers", "shares", "users"];

let _client: Client | null = null;

function client(): Client {
  if (!_client) {
    _client = createClient({ url: "file:./test.db" });
  }
  return _client;
}

export async function resetDb(): Promise<void> {
  const c = client();
  for (const table of TABLES) {
    await c.execute(`DELETE FROM ${table}`);
  }
}

export interface SeededUser {
  id: string;
  email: string;
  name: string;
}

export async function seedUser(
  email: string,
  name: string = email
): Promise<SeededUser> {
  const c = client();
  const id = nanoid();
  const now = new Date().toISOString();
  await c.execute({
    sql: `INSERT INTO users (id, google_id, email, name, avatar_url, created_at, updated_at)
          VALUES (?, ?, ?, ?, NULL, ?, ?)`,
    args: [id, `test:${email}`, email, name, now, now],
  });
  return { id, email, name };
}

export interface SeededImage {
  id: string;
  userId: string;
  date: string;
  r2Key: string;
  isCover: boolean;
}

export async function seedImage(
  userId: string,
  opts: {
    date: string;
    isCover?: boolean;
    description?: string | null;
    location?: string | null;
    r2Key?: string;
  }
): Promise<SeededImage> {
  const c = client();
  const id = nanoid();
  const now = new Date().toISOString();
  const r2Key = opts.r2Key ?? `seed/${userId}/${opts.date}/${id}.jpg`;
  const isCover = opts.isCover ?? false;
  await c.execute({
    sql: `INSERT INTO images
          (id, user_id, date, r2_key, thumbnail_r2_key, description, location, tags, is_cover, created_at, updated_at)
          VALUES (?, ?, ?, ?, NULL, ?, ?, NULL, ?, ?, ?)`,
    args: [
      id,
      userId,
      opts.date,
      r2Key,
      opts.description ?? null,
      opts.location ?? null,
      isCover ? 1 : 0,
      now,
      now,
    ],
  });
  return { id, userId, date: opts.date, r2Key, isCover };
}

export async function getImageById(id: string): Promise<{
  id: string;
  isCover: boolean;
} | null> {
  const c = client();
  const res = await c.execute({
    sql: "SELECT id, is_cover FROM images WHERE id = ?",
    args: [id],
  });
  const row = res.rows[0];
  if (!row) return null;
  return { id: row.id as string, isCover: Number(row.is_cover) === 1 };
}
