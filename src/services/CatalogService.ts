import { db } from "../db/db";
import { eq, and, desc } from "drizzle-orm";
import { catalogs } from "../db/schema/catalogs";
import { users } from "../db/schema/users";
import { Catalog, InsertCatalog } from "../db/schema";

export class CatalogService {
  async createCatalog(data: InsertCatalog): Promise<Catalog> {
    const [catalog] = await db.insert(catalogs).values(data).returning();

    return catalog;
  }

  async getUserCatalogs(
    telegramId: string,
    parentId?: number
  ): Promise<Catalog[]> {
    const userCatalogs = await db
      .select()
      .from(catalogs)
      .innerJoin(users, eq(catalogs.userId, users.id))
      .where(
        and(
          eq(users.telegramId, telegramId),
          parentId ? eq(catalogs.parentId, parentId) : undefined,
          eq(catalogs.isArchived, false)
        )
      )
      .orderBy(desc(catalogs.createdAt));

    return userCatalogs.map((uc: { catalogs: any }) => uc.catalogs);
  }

  async findUserByTelegramId(telegramId: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramId));

    return user;
  }

  async getOrCreateUser(
    telegramId: string,
    username?: string,
    firstName?: string,
    lastName?: string
  ) {
    let user = await this.findUserByTelegramId(telegramId);

    if (!user) {
      [user] = await db
        .insert(users)
        .values({
          telegramId,
          username,
        })
        .returning();
    }

    return user;
  }
}
