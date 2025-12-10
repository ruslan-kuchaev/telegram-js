import { Bot, GrammyError, HttpError, session, InlineKeyboard } from "grammy";
import { config } from "dotenv";
import { setupCatalogHandlers } from "./bot/handlers/catalogHandlers";
import { setupNoteHandlers } from "./bot/handlers/noteHandlers";
import { MyContext, SessionData } from "./types";
import { botHelp } from "./commands/help";
import { botClear } from "./commands/clear";
import { botDeletAll, userConfirmDeleteAll } from "./commands/DeletAll";
import { botStart } from "./commands/start";
import { menuCommands } from "./config/menuCommands";

config();

const bot = new Bot<MyContext>(process.env.API_KEY || "");

bot.use(
  session({
    initial(): SessionData {
      return {};
    },
  })
);

bot.api.setMyCommands(menuCommands)

bot.command("start", botStart);
bot.command("help", botHelp);
bot.command("clear", botClear);


bot.command("deleteall", botDeletAll);
bot.callbackQuery("confirm_delete_all", userConfirmDeleteAll);
bot.callbackQuery("cancel_delete", userConfirmDeleteAll);

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
