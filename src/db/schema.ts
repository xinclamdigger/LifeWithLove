import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  googleId: text("google_id").notNull().unique(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const images = sqliteTable(
  "images",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    date: text("date").notNull(), // YYYY-MM-DD
    r2Key: text("r2_key").notNull(),
    thumbnailR2Key: text("thumbnail_r2_key"),
    description: text("description"),
    location: text("location"),
    tags: text("tags"), // JSON array as string
    isCover: integer("is_cover", { mode: "boolean" }).default(false),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("idx_images_user_date").on(table.userId, table.date),
    index("idx_images_user_date_cover").on(
      table.userId,
      table.date,
      table.isCover
    ),
  ]
);

export const stickers = sqliteTable(
  "stickers",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    calendarUserId: text("calendar_user_id")
      .notNull()
      .references(() => users.id),
    month: text("month").notNull(), // YYYY-MM
    stickerType: text("sticker_type").notNull(),
    xPercent: integer("x_percent").notNull(), // 0-10000 basis points
    yPercent: integer("y_percent").notNull(), // 0-10000 basis points
    scale: integer("scale").notNull().default(100), // percentage: 100 = default
    rotation: integer("rotation").notNull().default(0), // degrees 0-359
    zIndex: integer("z_index").notNull().default(0),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("idx_stickers_calendar_month").on(table.calendarUserId, table.month),
  ]
);

export const shares = sqliteTable(
  "shares",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id),
    sharedWithId: text("shared_with_id")
      .notNull()
      .references(() => users.id),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("idx_shares_unique").on(table.ownerId, table.sharedWithId),
    index("idx_shares_shared_with").on(table.sharedWithId),
  ]
);
