import { Bot, InlineKeyboard } from "grammy";
import { MyContext } from "../../../types";
import { noteService, catalogService } from "../../../services";
import {
  choiceCatalogKeybards,
  mainKeyboard,
  viewNoteKeyboard,
} from "../../keyboards";

export function setupNoteActions(bot: Bot<MyContext>) {
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

    const catalogKeyboard = choiceCatalogKeybards({ catalogs: userCatalogs });

    ctx.session.creatingNote = { step: "selecting_catalog" };

    await ctx.reply("📂 *Выберите каталог для заметки:*", {
      parse_mode: "Markdown",
      reply_markup: catalogKeyboard,
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

    const keyboard = viewNoteKeyboard({ notes: catalogNotes });

    await ctx.editMessageText("📝 *Заметки в каталоге:*", {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    });

    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery(/^view_note_/, async (ctx) => {
    const noteId = parseInt(ctx.callbackQuery.data.replace("view_note_", ""));
    const note = await noteService.getNoteById(noteId);

    if (!note) {
      await ctx.answerCallbackQuery("❌ Заметка не найдена");
      return;
    }

    const metadata = note.metadata as any;
    if (metadata?.mediaFiles && Array.isArray(metadata.mediaFiles)) {
      if (metadata.isAlbum && metadata.mediaFiles.length > 1) {
        try {
          await ctx.api.sendMediaGroup(ctx.chat!.id, metadata.mediaFiles);
        } catch (error) {
          console.error("Error sending media group:", error);
          await ctx.reply("❌ Ошибка при отправке альбома");
        }
      } else if (metadata.mediaFiles.length === 1) {
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
    } else {
      if (note.type === "image" && note.imageUrl) {
        await ctx.replyWithPhoto(note.imageUrl, {
          caption: note.content || "",
          parse_mode: "Markdown",
        });
      } else if (note.type === "mixed" && note.fileUrl) {
        await ctx.replyWithVoice(note.fileUrl, {
          caption: note.content || "",
          parse_mode: "Markdown",
        });
      } else {
        // Для текстовых заметок отправляем только содержимое
        await ctx.reply(note.content || "Пустая заметка", {
          parse_mode: "Markdown",
        });
      }
    }

    const keyboard = new InlineKeyboard()
      .text("🗑️ Удалить", `delete_note_${noteId}`)
      .text("🔙 Назад", `view_catalog_${note.catalogId}`);

    await ctx.reply("Действия:", { reply_markup: keyboard });
    await ctx.answerCallbackQuery();
  });

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
