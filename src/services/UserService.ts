import { db } from "../db/db";
import { eq } from "drizzle-orm";
import { users } from "../db/schema/users";
import { catalogs } from "../db/schema/catalogs";
import { notes } from "../db/schema/notes";
import { tags } from "../db/schema/tags";

export class UserService {
  async deleteAllUserData(telegramId: string): Promise<boolean> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.telegramId, telegramId));

      if (!user) {
        return false;
      }

      await db.delete(users).where(eq(users.id, user.id));

      return true;
    } catch (error) {
      console.error("Error deleting user data:", error);
      return false;
    }
  }

  async getUserStats(telegramId: string) {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.telegramId, telegramId));

      if (!user) {
        return null;
      }

      const userCatalogs = await db
        .select()
        .from(catalogs)
        .where(eq(catalogs.userId, user.id));

      const userNotes = await db
        .select()
        .from(notes)
        .where(eq(notes.userId, user.id));

      const userTags = await db
        .select()
        .from(tags)
        .where(eq(tags.userId, user.id));

      return {
        catalogsCount: userCatalogs.length,
        notesCount: userNotes.length,
        tagsCount: userTags.length,
      };
    } catch (error) {
      console.error("Error getting user stats:", error);
      return null;
    }
  }
}
