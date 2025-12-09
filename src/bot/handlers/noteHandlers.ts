import { Bot, InlineKeyboard } from "grammy";
import { NoteService } from "../../services/NoteService";
import { CatalogService } from "../../services/CatalogService";
import { mainKeyboard } from "../keyboards";
import { MyContext } from "../../types";

export function setupNoteHandlers(bot: Bot<MyContext>) {
  const noteService = new NoteService();
  const catalogService = new CatalogService();


  async function processMediaGroup(
    ctx: MyContext,
    groupId: string,
    catalogId: number
  ) {
    const group = ctx.session.mediaGroups?.[groupId];
    if (!group) return;

    const messages = group.messages;

    try {
      const user = await catalogService.getOrCreateUser(
        ctx.from!.id.toString(),
        ctx.from!.username
      );


      const mediaFiles: any[] = [];
      let content = "";
      let captionEntities: any[] = [];

      messages.forEach((msg: any, index: number) => {
        const text = msg.text || msg.caption || "";
        if (text && !content) {
          content = text;
          captionEntities = msg.caption_entities || [];
        }


        if (msg.photo && msg.photo.length > 0) {
          const fileId = msg.photo[msg.photo.length - 1].file_id;
          mediaFiles.push({
            type: "photo",
            media: fileId,
            caption: index === 0 ? text : undefined,
            caption_entities: index === 0 ? captionEntities : undefined,
          });
        }

        else if (msg.video) {
          mediaFiles.push({
            type: "video",
            media: msg.video.file_id,
            caption: index === 0 ? text : undefined,
            caption_entities: index === 0 ? captionEntities : undefined,
          });
        }

        else if (msg.document) {
          mediaFiles.push({
            type: "document",
            media: msg.document.file_id,
            caption: index === 0 ? text : undefined,
            caption_entities: index === 0 ? captionEntities : undefined,
          });
        }
      });

      const title =
        content.split("\n")[0].substring(0, 100) ||
        `Альбом (${messages.length} файлов)`;

      await noteService.createNote({
        title,
        content: content || `Альбом из ${messages.length} файлов`,
        type: "telegram_post",
        catalogId,
        userId: user.id,
        metadata: {
          forwarded: true,
          forwardDate: messages[0].forward_origin,
          mediaGroupId: groupId,
          isAlbum: true,
          mediaFiles, 
        },
      });

      await ctx.reply(
        `✅ *Альбом сохранен!*\n📎 ${messages.length} файл${
          messages.length > 1 ? "ов" : ""
        }`,
        {
          parse_mode: "Markdown",
          reply_markup: mainKeyboard,
        }
      );

      ctx.session.creatingNote = undefined;
    } catch (error) {
      console.error("Error creating media group note:", error);
      await ctx.reply("❌ Ошибка при создании заметки");
    }


    if (ctx.session.mediaGroups) {
      delete ctx.session.mediaGroups[groupId];
    }
  }

  bot.hears("📝 Создать заметку", async (ctx) => {
    const userCatalogs = await catalogService.getUserCatalogs(
      ctx.from!.id.toString()
    );

    if (userCatalogs.length === 0) {
      await ctx.reply(
        "📭 У вас пока нет каталогов.\n\n" +
          'Сначала создайте каталог с помощью кнопки "📂 Создать каталог"',
        { reply_markup: mainKeyboard }
      );
      return;
    }

    const keyboard = new InlineKeyboard();
    userCatalogs.forEach((catalog) => {
      keyboard
        .text(
          `${catalog.emoji || "📁"} ${catalog.name}`,
          `select_catalog_${catalog.id}`
        )
        .row();
    });
    keyboard.text("🔙 Отмена", "cancel_note_creation");

    ctx.session.creatingNote = { step: "selecting_catalog" };

    await ctx.reply("📂 *Выберите каталог для заметки:*", {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    });
  });

  bot.callbackQuery(/^select_catalog_/, async (ctx) => {
    const catalogId = parseInt(
      ctx.callbackQuery.data.replace("select_catalog_", "")
    );

    ctx.session.creatingNote = {
      step: "waiting_content",
      catalogId,
    };

    await ctx.editMessageText(
      "📝 *Отправьте содержимое заметки:*\n\n" +
        "Вы можете:\n" +
        "• Написать текст\n" +
        "• Отправить фото с подписью\n" +
        "• Переслать сообщение\n" +
        "• Отправить голосовое сообщение",
      { parse_mode: "Markdown" }
    );

    await ctx.answerCallbackQuery();
  });


  bot.on("message:forward_origin", async (ctx, next) => {
    if (ctx.session.creatingNote?.step === "waiting_content") {
      const catalogId = ctx.session.creatingNote.catalogId!;
      const msg = ctx.message;


      if (msg.media_group_id) {
        const groupId = msg.media_group_id;


        if (!ctx.session.mediaGroups) {
          ctx.session.mediaGroups = {};
        }


        if (ctx.session.mediaGroups[groupId]) {
          ctx.session.mediaGroups[groupId].messages.push(msg);

          // Сбрасываем таймер
          clearTimeout(ctx.session.mediaGroups[groupId].timer);
          ctx.session.mediaGroups[groupId].timer = setTimeout(() => {
            processMediaGroup(ctx, groupId, catalogId);
          }, 1000); // Ждем 1 секунду после последнего сообщения
        } else {

          ctx.session.mediaGroups[groupId] = {
            messages: [msg],
            catalogId,
            timer: setTimeout(() => {
              processMediaGroup(ctx, groupId, catalogId);
            }, 1000),
          };
        }

        return;
      }


      try {
        const user = await catalogService.getOrCreateUser(
          ctx.from!.id.toString(),
          ctx.from!.username
        );


        let content = msg.text || msg.caption || "";


        const entities = msg.entities || msg.caption_entities || [];
        const links: string[] = [];

        entities.forEach((entity) => {
          if (entity.type === "url" || entity.type === "text_link") {
            const url =
              entity.type === "text_link"
                ? entity.url
                : content.substring(
                    entity.offset,
                    entity.offset + entity.length
                  );
            if (url) links.push(url);
          }
        });

        if (links.length > 0) {
          content += "\n\n🔗 Ссылки:\n" + links.join("\n");
        }


        let noteType = "telegram_post";
        let mediaFiles: any[] = [];
        let imageUrl: string | null = null;
        let fileUrl: string | null = null;

        // Фото
        if (msg.photo && msg.photo.length > 0) {
          noteType = "image";
          imageUrl = msg.photo[msg.photo.length - 1].file_id;
          mediaFiles = msg.photo.map((p) => ({
            type: "photo",
            file_id: p.file_id,
          }));
        }
        // Видео
        else if (msg.video) {
          noteType = "mixed";
          fileUrl = msg.video.file_id;
          mediaFiles.push({ type: "video", file_id: msg.video.file_id });
        }
        // Документ
        else if (msg.document) {
          noteType = "mixed";
          fileUrl = msg.document.file_id;
          mediaFiles.push({ type: "document", file_id: msg.document.file_id });
        }
        // Голосовое
        else if (msg.voice) {
          noteType = "mixed";
          fileUrl = msg.voice.file_id;
          mediaFiles.push({ type: "voice", file_id: msg.voice.file_id });
        }
        // Аудио
        else if (msg.audio) {
          noteType = "mixed";
          fileUrl = msg.audio.file_id;
          mediaFiles.push({ type: "audio", file_id: msg.audio.file_id });
        }


        const mediaForSending = mediaFiles.map((m: any) => ({
          type: m.type,
          media: m.file_id,
          caption: content,
          caption_entities: msg.caption_entities || msg.entities || [],
        }));

        const title =
          content.split("\n")[0].substring(0, 100) || "Пересланное сообщение";

        await noteService.createNote({
          title,
          content: content || "Медиа сообщение",
          type: "telegram_post",
          catalogId,
          userId: user.id,
          metadata: {
            forwarded: true,
            forwardDate: msg.forward_origin,
            mediaFiles:
              mediaForSending.length > 0 ? mediaForSending : undefined,
          },
        });

        ctx.session.creatingNote = undefined;

        await ctx.reply("✅ *Пересланное сообщение сохранено!*", {
          parse_mode: "Markdown",
          reply_markup: mainKeyboard,
        });
      } catch (error) {
        console.error("Error creating forwarded note:", error);
        await ctx.reply("❌ Ошибка при создании заметки");
      }
    } else {
      await next();
    }
  });


  bot.on("message:text", async (ctx, next) => {
    if (ctx.session.creatingNote?.step === "waiting_content") {
      const catalogId = ctx.session.creatingNote.catalogId!;
      const text = ctx.message.text;

      try {
        const user = await catalogService.getOrCreateUser(
          ctx.from!.id.toString(),
          ctx.from!.username
        );

        const title = text.split("\n")[0].substring(0, 100) || "Заметка";

        await noteService.createNote({
          title,
          content: text,
          type: "text",
          catalogId,
          userId: user.id,
        });

        ctx.session.creatingNote = undefined;

        await ctx.reply("✅ *Заметка успешно создана!*", {
          parse_mode: "Markdown",
          reply_markup: mainKeyboard,
        });
      } catch (error) {
        console.error("Error creating note:", error);
        await ctx.reply("❌ Ошибка при создании заметки");
      }
    } else {
      await next();
    }
  });


  bot.on("message:photo", async (ctx, next) => {
    if (ctx.session.creatingNote?.step === "waiting_content") {
      const catalogId = ctx.session.creatingNote.catalogId!;
      const photo = ctx.message.photo[ctx.message.photo.length - 1];
      const caption = ctx.message.caption || "Фото";

      try {
        const user = await catalogService.getOrCreateUser(
          ctx.from!.id.toString(),
          ctx.from!.username
        );

        await noteService.createNote({
          title: caption.substring(0, 100),
          content: caption,
          type: "image",
          imageUrl: photo.file_id,
          catalogId,
          userId: user.id,
        });

        ctx.session.creatingNote = undefined;

        await ctx.reply("✅ *Заметка с фото создана!*", {
          parse_mode: "Markdown",
          reply_markup: mainKeyboard,
        });
      } catch (error) {
        console.error("Error creating photo note:", error);
        await ctx.reply("❌ Ошибка при создании заметки");
      }
    } else {
      await next();
    }
  });


  bot.on("message:voice", async (ctx, next) => {
    if (ctx.session.creatingNote?.step === "waiting_content") {
      const catalogId = ctx.session.creatingNote.catalogId!;
      const voice = ctx.message.voice;

      try {
        const user = await catalogService.getOrCreateUser(
          ctx.from!.id.toString(),
          ctx.from!.username
        );

        await noteService.createNote({
          title: "Голосовое сообщение",
          content: "Голосовое сообщение",
          type: "mixed",
          fileUrl: voice.file_id,
          catalogId,
          userId: user.id,
          metadata: {
            duration: voice.duration,
            mimeType: voice.mime_type,
          },
        });

        ctx.session.creatingNote = undefined;

        await ctx.reply("✅ *Голосовое сообщение сохранено!*", {
          parse_mode: "Markdown",
          reply_markup: mainKeyboard,
        });
      } catch (error) {
        console.error("Error creating voice note:", error);
        await ctx.reply("❌ Ошибка при создании заметки");
      }
    } else {
      await next();
    }
  });

  bot.callbackQuery("cancel_note_creation", async (ctx) => {
    ctx.session.creatingNote = undefined;
    await ctx.editMessageText("❌ Создание заметки отменено");
    await ctx.reply("Что хотите сделать?", { reply_markup: mainKeyboard });
    await ctx.answerCallbackQuery();
  });

 
  bot.callbackQuery(/^view_catalog_/, async (ctx) => {
    const catalogId = parseInt(
      ctx.callbackQuery.data.replace("view_catalog_", "")
    );

    const catalogNotes = await noteService.getCatalogNotes(catalogId);

    if (catalogNotes.length === 0) {
      await ctx.answerCallbackQuery("📭 В этом каталоге пока нет заметок");
      return;
    }

    const keyboard = new InlineKeyboard();
    catalogNotes.forEach((note) => {
      const icon =
        note.type === "image" ? "🖼️" : note.type === "mixed" ? "🎤" : "📝";
      keyboard.text(`${icon} ${note.title}`, `view_note_${note.id}`).row();
    });
    keyboard.text("🔙 Назад", "back_to_catalogs");

    await ctx.editMessageText("📝 *Заметки в каталоге:*", {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    });

    await ctx.answerCallbackQuery();
  });

  // Просмотр конкретной заметки
  bot.callbackQuery(/^view_note_/, async (ctx) => {
    const noteId = parseInt(ctx.callbackQuery.data.replace("view_note_", ""));
    const note = await noteService.getNoteById(noteId);

    if (!note) {
      await ctx.answerCallbackQuery("❌ Заметка не найдена");
      return;
    }

    // Если есть сохраненные медиа файлы (новый формат)
    const metadata = note.metadata as any;
    if (metadata?.mediaFiles && Array.isArray(metadata.mediaFiles)) {
      // Отправляем заголовок
      await ctx.reply(`📝 *${note.title}*`, { parse_mode: "Markdown" });

      // Если это альбом - отправляем как media group
      if (metadata.isAlbum && metadata.mediaFiles.length > 1) {
        try {
          await ctx.api.sendMediaGroup(ctx.chat!.id, metadata.mediaFiles);
        } catch (error) {
          console.error("Error sending media group:", error);
          await ctx.reply("❌ Ошибка при отправке альбома");
        }
      }
      // Одиночное медиа
      else if (metadata.mediaFiles.length === 1) {
        const media = metadata.mediaFiles[0];
        try {
          if (media.type === "photo") {
            await ctx.replyWithPhoto(media.media, {
              caption: media.caption,
              caption_entities: media.caption_entities,
            });
          } else if (media.type === "video") {
            await ctx.replyWithVideo(media.media, {
              caption: media.caption,
              caption_entities: media.caption_entities,
            });
          } else if (media.type === "document") {
            await ctx.replyWithDocument(media.media, {
              caption: media.caption,
              caption_entities: media.caption_entities,
            });
          }
        } catch (error) {
          console.error("Error sending media:", error);
          if (note.content) {
            await ctx.reply(note.content);
          }
        }
      }
    }
    // Старый формат с originalMessages - копируем
    else if (
      metadata?.originalMessages &&
      Array.isArray(metadata.originalMessages)
    ) {
      await ctx.reply(`📝 *${note.title}*`, { parse_mode: "Markdown" });

      for (const msgData of metadata.originalMessages) {
        try {
          await ctx.api.copyMessage(
            ctx.chat!.id,
            msgData.chatId,
            msgData.messageId
          );
        } catch (error) {
          console.error("Error copying message:", error);
          if (note.content) {
            await ctx.reply(note.content);
          }
        }
      }
    }
    // Старый формат или обычная заметка
    else {
      let message = `📝 *${note.title}*\n\n`;

      if (note.type === "image" && note.imageUrl) {
        await ctx.replyWithPhoto(note.imageUrl, {
          caption: message + (note.content || ""),
          parse_mode: "Markdown",
        });
      } else if (note.type === "mixed" && note.fileUrl) {
        await ctx.replyWithVoice(note.fileUrl, {
          caption: message,
          parse_mode: "Markdown",
        });
      } else {
        message += note.content || "";
        await ctx.reply(message, { parse_mode: "Markdown" });
      }
    }

    const keyboard = new InlineKeyboard()
      .text("🗑️ Удалить", `delete_note_${noteId}`)
      .text("🔙 Назад", `view_catalog_${note.catalogId}`);

    await ctx.reply("Действия:", { reply_markup: keyboard });
    await ctx.answerCallbackQuery();
  });

  // Удаление заметки
  bot.callbackQuery(/^delete_note_/, async (ctx) => {
    const noteId = parseInt(ctx.callbackQuery.data.replace("delete_note_", ""));

    try {
      await noteService.deleteNote(noteId);
      await ctx.editMessageText("✅ Заметка удалена");
      await ctx.answerCallbackQuery("Заметка удалена");
    } catch (error) {
      console.error("Error deleting note:", error);
      await ctx.answerCallbackQuery("❌ Ошибка при удалении");
    }
  });
}
