import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  boolean,
  json,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// ==================== ТАБЛИЦЫ ====================

// Пользователи
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

// Каталоги (папки)
export const catalogs = pgTable("catalogs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  emoji: text("emoji").default("📁"),
  color: text("color").default("#3B82F6"), // hex цвет для веб-интерфейса
  parentId: integer("parent_id"), // для вложенных каталогов
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  position: integer("position").default(0), // порядок сортировки
  isArchived: boolean("is_archived").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Заметки
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

// Теги для заметок (отдельная таблица для более гибкого поиска)
export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").default("#6B7280"),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Связь многие-ко-многим между заметками и тегами
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
