import { db } from "../src/db/db";
import { users } from "../src/db/schema/users";
import { catalogs } from "../src/db/schema/catalogs";
import { notes } from "../src/db/schema/notes";
import { tags } from "../src/db/schema/tags";
import { noteTags } from "../src/db/schema/noteTags";

async function clearDatabase() {
  try {
    console.log("🗑️  Очистка базы данных...");

    // Удаляем в правильном порядке (из-за foreign keys)
    await db.delete(noteTags);
    console.log("✅ noteTags очищена");

    await db.delete(notes);
    console.log("✅ notes очищена");

    await db.delete(tags);
    console.log("✅ tags очищена");

    await db.delete(catalogs);
    console.log("✅ catalogs очищена");

    await db.delete(users);
    console.log("✅ users очищена");

    console.log("\n🎉 База данных полностью очищена!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Ошибка при очистке:", error);
    process.exit(1);
  }
}

clearDatabase();
