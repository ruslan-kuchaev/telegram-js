import {
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    telegramId: text("telegram_id").notNull().unique(),
    username: text("username"),
    languageCode: text("language_code").default("ru"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => {
    return {
      telegramIdIdx: uniqueIndex("telegram_id_idx").on(table.telegramId),
    };
  }
);
