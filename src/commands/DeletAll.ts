import { InlineKeyboard } from "grammy";
import { mainKeyboard } from "../bot/keyboards";
import { userService } from "../services";
import { MyContext } from "../types";

export async function botDeletAll(ctx : MyContext){
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
      
}


export async function userConfirmDeleteAll(ctx : MyContext){
await ctx.editMessageText("⏳ Удаление данных...");

  const success = await userService.deleteAllUserData(ctx.from!.id.toString());

  if (success) {
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
}


export async function userCancelDelete(ctx : MyContext){
 await ctx.editMessageText("🔙 Удаление отменено");
  await ctx.reply("Что хотите сделать?", { reply_markup: mainKeyboard });
  await ctx.answerCallbackQuery();
}