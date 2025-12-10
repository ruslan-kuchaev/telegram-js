import { MyContext } from "../../../types";
import { noteService, catalogService } from "../../../services";
import { mainKeyboard } from "../../keyboards";

export async function processMediaGroup(
  ctx: MyContext,
  groupId: string,
  catalogId: number
): Promise<void> {
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
      } else if (msg.video) {
        mediaFiles.push({
          type: "video",
          media: msg.video.file_id,
          caption: index === 0 ? text : undefined,
          caption_entities: index === 0 ? captionEntities : undefined,
        });
      } else if (msg.document) {
        mediaFiles.push({
          type: "document",
          media: msg.document.file_id,
          caption: index === 0 ? text : undefined,
          caption_entities: index === 0 ? captionEntities : undefined,
        });
      }
    });

    let forwardInfo = "";
    const firstMessage = messages[0];
    if (firstMessage.forward_origin) {
      const origin = firstMessage.forward_origin;
      if (origin.type === "channel") {
        const channelName = origin.chat.title || origin.chat.username || "Неизвестный канал";
        forwardInfo = `📢 Forwarded from: ${channelName}`;
      } else if (origin.type === "user") {
        const userName = origin.sender_user.first_name + (origin.sender_user.last_name ? ` ${origin.sender_user.last_name}` : "");
        forwardInfo = `👤 Forwarded from: ${userName}`;
      } else if (origin.type === "chat") {
        const chatName = origin.sender_chat.title || "Неизвестный чат";
        forwardInfo = `💬 Forwarded from: ${chatName}`;
      } else if (origin.type === "hidden_user") {
        forwardInfo = `🔒 Forwarded from: ${origin.sender_user_name}`;
      }
    }

    const fullContent = forwardInfo 
      ? `${forwardInfo}\n\n${content || `Альбом из ${messages.length} файлов`}`
      : content || `Альбом из ${messages.length} файлов`;

    const title =
      content.split("\n")[0].substring(0, 100) ||
      `Альбом (${messages.length} файлов)`;

    await noteService.createNote({
      title,
      content: fullContent,
      type: "telegram_post",
      catalogId,
      userId: user.id,
      metadata: {
        forwarded: true,
        forwardDate: messages[0].forward_origin,
        mediaGroupId: groupId,
        isAlbum: true,
        mediaFiles,
        forwardInfo,
      },
    });

    await ctx.reply(
      `✅ *Альбом сохранен!*\n📎 ${messages.length} файл${
        messages.length > 1 ? "ов" : ""
      }`,
      {
        parse_mode: "Markdown",
        reply_markup: mainKeyboard,
        reply_to_message_id: messages[0].message_id,
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
