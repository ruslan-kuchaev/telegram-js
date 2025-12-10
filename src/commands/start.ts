import { mainKeyboard } from "../bot/keyboards";
import { MyContext } from "../types";

export async function botStart(ctx : MyContext){
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
}