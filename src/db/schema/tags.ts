import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").default("#6B7280"),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});
