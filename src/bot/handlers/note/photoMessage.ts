import { Bot } from "grammy";
import { MyContext } from "../../../types";
import { noteService, catalogService } from "../../../services";
import { mainKeyboard } from "../../keyboards";
import { processMediaGroup } from "./mediaGroup";

async function savePhotoNote(ctx: MyContext): Promise<void> {
  const catalogId = ctx.session.creatingNote!.catalogId!;
  const message = ctx.message;

  if (!message || !message.photo) {
    await ctx.reply("❌ Ошибка: сообщение с фото не найдено");
    return;
  }


  if (message.media_group_id) {
    handleMediaGroup(ctx, message, catalogId);
    return;
  }

  try {
    const user = await catalogService.getOrCreateUser(
      ctx.from!.id.toString(),
      ctx.from!.username
    );

    const caption = message.caption || "Фото";
    const photo = message.photo[message.photo.length - 1];

    await noteService.createNote({
      title: caption.substring(0, 100),
      content: caption,
      type: "image",
      imageUrl: photo.file_id,
      catalogId,
      userId: user.id,
      metadata: {
        telegramMessage: message,
      },
    });

    ctx.session.creatingNote = undefined;
    await ctx.reply("✅ *Заметка с фото создана!*", {
      parse_mode: "Markdown",
      reply_markup: mainKeyboard,
      reply_to_message_id: message.message_id,
    });
  } catch (error) {
    console.error("Error creating photo note:", error);
    await ctx.reply("❌ Ошибка при создании заметки");
  }
}

function handleMediaGroup(ctx: MyContext, message: any, catalogId: number): void {
  const groupId = message.media_group_id;
  
  if (!ctx.session.mediaGroups) {
    ctx.session.mediaGroups = {};
  }

  // Добавляем сообщение в группу
  if (!ctx.session.mediaGroups[groupId]) {
    ctx.session.mediaGroups[groupId] = {
      messages: [],
      catalogId,
      timer: setTimeout(() => {
        processMediaGroup(ctx, groupId, catalogId);
      }, 300), // Короткое ожидание
    };
  }

  ctx.session.mediaGroups[groupId].messages.push(message);
  
  // Сбрасываем таймер при каждом новом сообщении
  clearTimeout(ctx.session.mediaGroups[groupId].timer);
  ctx.session.mediaGroups[groupId].timer = setTimeout(() => {
    processMediaGroup(ctx, groupId, catalogId);
  }, 300);
}

export function setupPhotoMessageHandler(bot: Bot<MyContext>) {
  bot.on("message:photo", async (ctx, next) => {
    if (ctx.session.creatingNote?.step === "waiting_content") {
      await savePhotoNote(ctx);
    } else {
      await next();
    }
  });
}
