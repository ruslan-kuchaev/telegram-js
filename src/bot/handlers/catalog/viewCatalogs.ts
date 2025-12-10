import { Bot, InlineKeyboard } from "grammy";
import { MyContext } from "../../../types";
import { catalogService } from "../../../services";
import { choiceCatalogKeybards, mainKeyboard } from "../../keyboards";

export function setupViewCatalogsHandler(bot: Bot<MyContext>) {
  bot.hears("📁 Мои каталоги", async (ctx) => {
    const userCatalogs = await catalogService.getUserCatalogs(
      ctx.from!.id.toString()
    );

    if (userCatalogs.length === 0) {
      await ctx.reply(
        "📭 У вас пока нет каталогов.\n\n" +
          'Создайте первый каталог с помощью кнопки "📂 Создать каталог"',
        { reply_markup: mainKeyboard }
      );
      return;
    }
    const keyboard = choiceCatalogKeybards({
      catalogs: userCatalogs,
    });

    await ctx.reply("📂 *Ваши каталоги:*\n\nВыберите каталог для просмотра:", {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    });
  });

  bot.callbackQuery("back_to_catalogs", async (ctx) => {
    const userCatalogs = await catalogService.getUserCatalogs(
      ctx.from!.id.toString()
    );

    const keyboard = choiceCatalogKeybards({
      catalogs: userCatalogs,
    });
    await ctx.editMessageText(
      "📂 *Ваши каталоги:*\n\nВыберите каталог для просмотра:",
      {
        parse_mode: "Markdown",
        reply_markup: keyboard,
      }
    );

    await ctx.answerCallbackQuery();
  });
}
