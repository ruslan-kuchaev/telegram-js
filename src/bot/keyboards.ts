import { Keyboard, InlineKeyboard } from "grammy";
import { UserCatalog } from "../services/CatalogService";
import { Note } from "../db/schema";

export const catalogIcons = [
  "📁",
  "📂",
  "📅",
  "📊",
  "📈",
  "📉",
  "📋",
  "📝",
  "📌",
  "📍",
  "🎯",
  "⭐",
  "🔥",
  "💡",
  "📚",
  "🎨",
  "🎵",
  "🎮",
  "🏠",
  "🏢",
  "🌍",
  "📱",
  "💻",
  "🔒",
  "❤️",
  "💰",
  "🚀",
  "📦",
  "🎁",
  "🔔",
] as const;

export type CatalogIcon = (typeof catalogIcons)[number];

export const mainKeyboard = new Keyboard()
  .text("📁 Мои каталоги")
  .text("📝 Создать заметку")
  .row()
  .text("📂 Создать каталог")
  .text("🗺️ Карта заметок")
  .resized();

export function getIconsKeyboard(page: number = 0): InlineKeyboard {
  const itemsPerPage = 8;
  const startIndex = page * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageIcons = catalogIcons.slice(startIndex, endIndex);

  const keyboard = new InlineKeyboard();

  for (let i = 0; i < pageIcons.length; i += 2) {
    const icon1 = pageIcons[i];
    const icon2 = pageIcons[i + 1];

    if (icon1) {
      keyboard.text(icon1, `icon_${icon1}`);
    }
    if (icon2) {
      keyboard.text(icon2, `icon_${icon2}`);
    }
    if (icon1 || icon2) {
      keyboard.row();
    }
  }

  const totalPages = Math.ceil(catalogIcons.length / itemsPerPage);
  if (totalPages > 1) {
    if (page > 0) {
      keyboard.text("⬅️ Назад", `icons_page_${page - 1}`);
    }
    if (page < totalPages - 1) {
      keyboard.text("Вперед ➡️", `icons_page_${page + 1}`);
    }
    keyboard.row();
  }

  keyboard.text("❌ Без иконки", "icon_null");
  keyboard.text("🔙 Отмена", "cancel_create_catalog");

  return keyboard;
}

export const cancelKeyboard = new InlineKeyboard().text(
  "🔙 Отмена",
  "cancel_create_catalog"
);

export function choiceCatalogKeybards({
  catalogs,
}: {
  catalogs: UserCatalog["catalogs"];
}): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  catalogs.forEach((catalog) => {
    keyboard.text(
      `${catalog.emoji || "📁"} ${catalog.name}`,
      `select_catalog_${catalog.id}`
    );
    keyboard.row();
  });

  keyboard.text("🔙 Назад", "back_to_main");

  return keyboard;
}

export function viewNoteKeyboard({ notes }: { notes: Note[] }): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  notes.forEach((note) => {
    const icon =
      note.type === "image" ? "🖼️" : note.type === "mixed" ? "🎤" : "📝";
    keyboard.text(`${icon} ${note.title}`, `view_note_${note.id}`).row();
  });

  keyboard.text("🔙 Назад", "back_to_catalogs");

  return keyboard;
}
