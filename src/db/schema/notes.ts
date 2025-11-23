import {
  boolean,
  integer,
  json,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { catalogs } from "./catalogs";
import { users } from "./users";

export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content"), // текстовое содержимое
  type: text("type").notNull().default("text"), // 'text', 'image', 'telegram_post', 'mixed'
  telegramPostId: text("telegram_post_id"), // ID оригинального поста в Telegram
  telegramPostUrl: text("telegram_post_url"), // URL телеграм поста
  imageUrl: text("image_url"), // URL картинки
  fileUrl: text("file_url"), // URL файла
  metadata: json("metadata"), // дополнительная метаинформация
  catalogId: integer("catalog_id")
    .notNull()
    .references(() => catalogs.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  position: integer("position").default(0), // порядок в каталоге
  isPinned: boolean("is_pinned").default(false), // закрепленная заметка
  isArchived: boolean("is_archived").default(false),
  tags: text("tags").array(), // теги для поиска
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
