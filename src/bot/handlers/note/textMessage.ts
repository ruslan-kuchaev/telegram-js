import { Bot } from "grammy";
import { MyContext } from "../../../types";
import { noteService, catalogService } from "../../../services";
import { mainKeyboard } from "../../keyboards";

async function saveTextNote(ctx: MyContext): Promise<void> {
  const catalogId = ctx.session.creatingNote!.catalogId!;
  const message = ctx.message;
  
  if (!message || !message.text) {
    await ctx.reply("❌ Ошибка: текстовое сообщение не найдено");
    return;
  }

  try {
    const user = await catalogService.getOrCreateUser(
      ctx.from!.id.toString(),
      ctx.from!.username
    );

    const text = message.text;
    const title = text.split("\n")[0].substring(0, 100) || "Заметка";

    await noteService.createNote({
      title,
      content: text,
      type: "text",
      catalogId,
      userId: user.id,
      metadata: {
        telegramMessage: message,
      },
    });

    ctx.session.creatingNote = undefined;
    await ctx.reply("✅ *Заметка успешно создана!*", {
      parse_mode: "Markdown",
      reply_markup: mainKeyboard,
      reply_to_message_id: message.message_id,
    });


    
  } catch (error) {
    console.error("Error creating note:", error);
    await ctx.reply("❌ Ошибка при создании заметки");
  }
}

export function setupTextMessageHandler(bot: Bot<MyContext>) {
  bot.on("message:text", async (ctx, next) => {
    if (ctx.session.creatingNote?.step === "waiting_content") {
      await saveTextNote(ctx);
    } else {
      await next();
    }
  });
}