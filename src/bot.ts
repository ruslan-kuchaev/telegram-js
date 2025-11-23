import { Bot, GrammyError, HttpError } from "grammy";
import { Menu } from "@grammyjs/menu";
import { config } from "dotenv";

config();

console.log("✅ Токен загружен!");

const bot = new Bot(process.env.API_KEY || "");

bot.api.setMyCommands([
  { command: "start", description: "Start the bot" },
  { command: "srt", description: "Send a message" },
]);

const menu = new Menu("my-menu-identifier")
  .text("A", (ctx) => ctx.reply("You pressed A!"))
  .row()
  .text("B", (ctx) => ctx.reply("You pressed B!"));

bot.use(menu);

bot.command("start", async (ctx) => {
  await ctx.reply("Check out this menu:", { reply_markup: menu });
});

bot.command("srt", (ctx) => ctx.reply("Welcome! Up and running."));

bot.on("message", (ctx) => ctx.reply("Got another message!"));

bot.catch((error) => {
  const ctx = error.ctx;
  console.error(`Error ${ctx.update.update_id}`);
  const e = error.error;

  if (e instanceof GrammyError) {
    console.error(e);
  } else if (e instanceof HttpError) {
    console.error(e);
  }
});

bot.start();
