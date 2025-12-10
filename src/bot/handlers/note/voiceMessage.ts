import { Bot } from "grammy";
import { MyContext } from "../../../types";
import { noteService, catalogService } from "../../../services";
import { mainKeyboard } from "../../keyboards";

async function saveVoiceNote(ctx: MyContext): Promise<void> {
  const catalogId = ctx.session.creatingNote!.catalogId!;
  const message = ctx.message;

  if (!message || !message.voice) {
    await ctx.reply("❌ Ошибка: голосовое сообщение не найдено");
    return;
  }

  try {
    const user = await catalogService.getOrCreateUser(
      ctx.from!.id.toString(),
      ctx.from!.username
    );

    const voice = message.voice;

    await noteService.createNote({
      title: "Голосовое сообщение",
      content: "Голосовое сообщение",
      type: "mixed",
      fileUrl: voice.file_id,
      catalogId,
      userId: user.id,
      metadata: {
        telegramMessage: message,
        duration: voice.duration,
        mimeType: voice.mime_type,
      },
    });

    ctx.session.creatingNote = undefined;
    await ctx.reply("✅ *Голосовое сообщение сохранено!*", {
      parse_mode: "Markdown",
      reply_markup: mainKeyboard,
      reply_to_message_id: message.message_id,
    });


  } catch (error) {
    console.error("Error creating voice note:", error);
    await ctx.reply("❌ Ошибка при создании заметки");
  }
}

export function setupVoiceMessageHandler(bot: Bot<MyContext>) {
  bot.on("message:voice", async (ctx, next) => {
    if (ctx.session.creatingNote?.step === "waiting_content") {
      await saveVoiceNote(ctx);
    } else {
      await next();
    }
  });
}
