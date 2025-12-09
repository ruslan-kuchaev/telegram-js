import { Bot, GrammyError, HttpError, session, InlineKeyboard } from "grammy";
import { config } from "dotenv";
import { setupCatalogHandlers } from "./bot/handlers/catalogHandlers";
import { setupNoteHandlers } from "./bot/handlers/noteHandlers";
import { mainKeyboard } from "./bot/keyboards";
import { MyContext, SessionData } from "./types";
import { UserService } from "./services/UserService";

config();

const bot = new Bot<MyContext>(process.env.API_KEY || "");

bot.use(
  session({
    initial(): SessionData {
      return {};
    },
  })
);

bot.api.setMyCommands([
  { command: "start", description: "Запустить бота" },
  { command: "help", description: "Помощь" },
  { command: "clear", description: "Очистить сообщения бота" },
  { command: "deleteall", description: "Удалить все мои данные" },
]);

bot.command("start", async (ctx) => {
  const firstName = ctx.from?.first_name || "друг";

  await ctx.reply(
    `👋 Привет, ${firstName}!\n\n` +
      "Я бот для создания заметок и каталогов.\n\n" +
      "📂 Создавай каталоги для организации заметок\n" +
      "📝 Сохраняй текст, фото, голосовые сообщения\n" +
      "📋 Пересылай посты из других чатов\n\n" +
      "Выбери действие:",
    { reply_markup: mainKeyboard }
  );
});

bot.command("help", async (ctx) => {
  await ctx.reply(
    "📖 *Как пользоваться ботом:*\n\n" +
      "1️⃣ Создай каталог с помощью кнопки 📂\n" +
      "2️⃣ Выбери иконку для каталога и название\n" +
      "3️⃣ Создавай заметки в каталогах 📝\n\n" +
      "Просматривай свои каталоги через кнопку 📁",
    { parse_mode: "Markdown", reply_markup: mainKeyboard }
  );
});

bot.command("clear", async (ctx) => {
  for (let i = 0; i < 10; i++) {
    await ctx.reply("🧹");
  }
});

// Команда /deleteall - удалить все данные пользователя
bot.command("deleteall", async (ctx) => {
  const userService = new UserService();
  const stats = await userService.getUserStats(ctx.from!.id.toString());

  if (!stats) {
    await ctx.reply("У вас пока нет данных в боте.", {
      reply_markup: mainKeyboard,
    });
    return;
  }

  const keyboard = new InlineKeyboard()
    .text("❌ Да, удалить ВСЁ", "confirm_delete_all")
    .row()
    .text("🔙 Отмена", "cancel_delete");

  await ctx.reply(
    "⚠️ *ВНИМАНИЕ!*\n\n" +
      "Это удалит:\n" +
      `• ${stats.catalogsCount} каталог${
        stats.catalogsCount > 1 ? "ов" : ""
      }\n` +
      `• ${stats.notesCount} заметок${stats.notesCount > 1 ? "" : "у"}\n` +
      `• ${stats.tagsCount} тег${stats.tagsCount > 1 ? "ов" : ""}\n\n` +
      "Это действие *нельзя отменить*!\n\n" +
      "Вы уверены?",
    {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    }
  );
});

// Подтверждение удаления
bot.callbackQuery("confirm_delete_all", async (ctx) => {
  const userService = new UserService();

  await ctx.editMessageText("⏳ Удаление данных...");

  const success = await userService.deleteAllUserData(ctx.from!.id.toString());

  if (success) {
    // Очищаем сессию
    ctx.session = {};

    await ctx.editMessageText(
      "✅ *Все ваши данные удалены!*\n\n" +
        "Вы можете начать заново с помощью /start",
      { parse_mode: "Markdown" }
    );
  } else {
    await ctx.editMessageText("❌ Ошибка при удалении данных");
  }

  await ctx.answerCallbackQuery();
});

// Отмена удаления
bot.callbackQuery("cancel_delete", async (ctx) => {
  await ctx.editMessageText("🔙 Удаление отменено");
  await ctx.reply("Что хотите сделать?", { reply_markup: mainKeyboard });
  await ctx.answerCallbackQuery();
});

setupCatalogHandlers(bot);
setupNoteHandlers(bot);

bot.catch((error) => {
  const ctx = error.ctx;
  console.error(`Error ${ctx.update.update_id}`);
  const e = error.error;

  if (e instanceof GrammyError) {
    console.error("Grammy error:", e.description);
  } else if (e instanceof HttpError) {
    console.error("HTTP error:", e);
  } else {
    console.error("Unknown error:", e);
  }
});

bot.start();
console.log("🤖 Бот запущен!");
