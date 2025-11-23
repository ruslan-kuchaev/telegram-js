import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./schema/users";
import { catalogs } from "./schema/catalogs";
import { notes } from "./schema/notes";
import { tags } from "./schema/tags";
import { noteTags } from "./schema/noteTags";

// ==================== RELATIONS (СВЯЗИ) ====================

export const usersRelations = relations(users, ({ many }) => ({
  catalogs: many(catalogs),
  notes: many(notes),
  tags: many(tags),
}));

export const catalogsRelations = relations(catalogs, ({ one, many }) => ({
  user: one(users, {
    fields: [catalogs.userId],
    references: [users.id],
  }),
  parent: one(catalogs, {
    fields: [catalogs.parentId],
    references: [catalogs.id],
    relationName: "catalog_hierarchy",
  }),
  children: many(catalogs, {
    relationName: "catalog_hierarchy",
  }),
  notes: many(notes),
}));

export const notesRelations = relations(notes, ({ one, many }) => ({
  user: one(users, {
    fields: [notes.userId],
    references: [users.id],
  }),
  catalog: one(catalogs, {
    fields: [notes.catalogId],
    references: [catalogs.id],
  }),
  noteTags: many(noteTags),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
  user: one(users, {
    fields: [tags.userId],
    references: [users.id],
  }),
  noteTags: many(noteTags),
}));

export const noteTagsRelations = relations(noteTags, ({ one }) => ({
  note: one(notes, {
    fields: [noteTags.noteId],
    references: [notes.id],
  }),
  tag: one(tags, {
    fields: [noteTags.tagId],
    references: [tags.id],
  }),
}));

// ==================== ZOD SCHEMAS (ВАЛИДАЦИЯ) ====================

// Схемы для вставки данных
export const insertUserSchema = createInsertSchema(users, {
  telegramId: z.string().min(1),
  username: z.string().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCatalogSchema = createInsertSchema(catalogs, {
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  emoji: z.string().emoji().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNoteSchema = createInsertSchema(notes, {
  title: z.string().min(1).max(200),
  content: z.string().max(10000).optional(),
  type: z.enum(["text", "image", "telegram_post", "mixed"]),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTagSchema = createInsertSchema(tags, {
  name: z.string().min(1).max(50),
  color: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .optional(),
}).omit({
  id: true,
  createdAt: true,
});

// Схемы для выборки данных
export const selectUserSchema = createSelectSchema(users);
export const selectCatalogSchema = createSelectSchema(catalogs);
export const selectNoteSchema = createSelectSchema(notes);
export const selectTagSchema = createSelectSchema(tags);

// ==================== ТИПЫ TypeScript ====================

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Catalog = typeof catalogs.$inferSelect;
export type InsertCatalog = typeof catalogs.$inferInsert;

export type Note = typeof notes.$inferSelect;
export type InsertNote = typeof notes.$inferInsert;

export type Tag = typeof tags.$inferSelect;
export type InsertTag = typeof tags.$inferInsert;

export type NoteTag = typeof noteTags.$inferSelect;
export type InsertNoteTag = typeof noteTags.$inferInsert;
