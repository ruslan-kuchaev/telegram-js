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
  content: text("content"), 
  type: text("type").notNull().default("text"), 
  telegramPostId: text("telegram_post_id"), 
  telegramPostUrl: text("telegram_post_url"), 
  imageUrl: text("image_url"), 
  fileUrl: text("file_url"), 
  metadata: json("metadata"),
  catalogId: integer("catalog_id")
    .notNull()
    .references(() => catalogs.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  position: integer("position").default(0), 
  isPinned: boolean("is_pinned").default(false), 
  isArchived: boolean("is_archived").default(false),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
