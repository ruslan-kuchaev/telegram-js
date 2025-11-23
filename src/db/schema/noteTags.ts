import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { notes } from "./notes";
import { tags } from "./tags";

export const noteTags = pgTable("note_tags", {
  id: serial("id").primaryKey(),
  noteId: integer("note_id")
    .notNull()
    .references(() => notes.id, { onDelete: "cascade" }),
  tagId: integer("tag_id")
    .notNull()
    .references(() => tags.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});
