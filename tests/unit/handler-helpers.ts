import { createClient, type Client } from "@libsql/client";
import { nanoid } from "nanoid";

let _client: Client | null = null;

function client(): Client {
  if (!_client) _client = createClient({ url: "file:./vitest.db" });
  return _client;
}

const TABLES = ["images", "stickers", "shares", "users"];

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

export async function seedShare(
  ownerId: string,
  sharedWithId: string
): Promise<string> {
  const c = client();
  const id = nanoid();
  await c.execute({
    sql: `INSERT INTO shares (id, owner_id, shared_with_id, created_at)
          VALUES (?, ?, ?, ?)`,
    args: [id, ownerId, sharedWithId, new Date().toISOString()],
  });
  return id;
}

export async function seedSticker(opts: {
  userId: string;
  calendarUserId: string;
  month: string;
  stickerType?: string;
  xPercent?: number;
  yPercent?: number;
  scale?: number;
  rotation?: number;
  zIndex?: number;
}): Promise<string> {
  const c = client();
  const id = nanoid();
  await c.execute({
    sql: `INSERT INTO stickers
          (id, user_id, calendar_user_id, month, sticker_type,
           x_percent, y_percent, scale, rotation, z_index, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      opts.userId,
      opts.calendarUserId,
      opts.month,
      opts.stickerType ?? "heart",
      opts.xPercent ?? 5000,
      opts.yPercent ?? 5000,
      opts.scale ?? 100,
      opts.rotation ?? 0,
      opts.zIndex ?? 0,
      new Date().toISOString(),
    ],
  });
  return id;
}

export async function getStickerById(id: string): Promise<
  | {
      id: string;
      userId: string;
      stickerType: string;
      xPercent: number;
      yPercent: number;
      scale: number;
      rotation: number;
      zIndex: number;
    }
  | null
> {
  const c = client();
  const res = await c.execute({
    sql: `SELECT id, user_id, sticker_type, x_percent, y_percent, scale, rotation, z_index
          FROM stickers WHERE id = ?`,
    args: [id],
  });
  const row = res.rows[0];
  if (!row) return null;
  return {
    id: row.id as string,
    userId: row.user_id as string,
    stickerType: row.sticker_type as string,
    xPercent: Number(row.x_percent),
    yPercent: Number(row.y_percent),
    scale: Number(row.scale),
    rotation: Number(row.rotation),
    zIndex: Number(row.z_index),
  };
}

export async function countShares(): Promise<number> {
  const c = client();
  const res = await c.execute("SELECT COUNT(*) AS n FROM shares");
  return Number(res.rows[0].n);
}

export function sessionFor(user: { id: string; email: string }) {
  return { user: { id: user.id, email: user.email, name: user.email } };
}
