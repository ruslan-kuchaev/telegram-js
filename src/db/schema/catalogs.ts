import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./users";

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
