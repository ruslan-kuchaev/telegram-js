import { Bot } from "grammy";
import { MyContext } from "../../../types";
import { noteService, catalogService } from "../../../services";
import { mainKeyboard } from "../../keyboards";
import { processMediaGroup } from "./mediaGroup";

export function setupForwardedMessageHandler(bot: Bot<MyContext>) {
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

          clearTimeout(ctx.session.mediaGroups[groupId].timer);

          ctx.session.mediaGroups[groupId].timer = setTimeout(() => {
            processMediaGroup(ctx, groupId, catalogId);
          }, 1000); 
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


        if (msg.photo && msg.photo.length > 0) {
          noteType = "image";

          imageUrl = msg.photo[msg.photo.length - 1].file_id;

          mediaFiles = msg.photo.map((p) => ({
            type: "photo",

            file_id: p.file_id,
          }));
        }

        else if (msg.video) {
          noteType = "mixed";

          fileUrl = msg.video.file_id;

          mediaFiles.push({ type: "video", file_id: msg.video.file_id });
        }
        else if (msg.document) {
          noteType = "mixed";

          fileUrl = msg.document.file_id;

          mediaFiles.push({ type: "document", file_id: msg.document.file_id });
        }
        else if (msg.voice) {
          noteType = "mixed";

          fileUrl = msg.voice.file_id;

          mediaFiles.push({ type: "voice", file_id: msg.voice.file_id });
        }

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
}
