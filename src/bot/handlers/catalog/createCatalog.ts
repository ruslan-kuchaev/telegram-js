import { Bot } from "grammy";
import { MyContext } from "../../../types";
import { catalogService } from "../../../services";
import { mainKeyboard, getIconsKeyboard, cancelKeyboard } from "../../keyboards";

export function setupCreateCatalogHandler(bot: Bot<MyContext>) {
  bot.hears("📂 Создать каталог", async (ctx) => {
    ctx.session.creatingCatalog = {
      step: "waiting_name",
    };

    await ctx.reply(
      "📝 *Введите название для нового каталога:*\n\n" +
        "используете emoji для удобства 🎯",
      {
        parse_mode: "Markdown",
        reply_markup: cancelKeyboard,
      }
    );
  });

  bot.on("message:text", async (ctx, next) => {
    if (ctx.session.creatingCatalog?.step === "waiting_name") {
      const catalogName = ctx.message.text.trim();

      if (catalogName.length === 0) {
        await ctx.reply(
          "❌ Название не может быть пустым. Попробуйте еще раз:"
        );
        return;
      }

      ctx.session.creatingCatalog = {
        step: "waiting_icon",
        name: catalogName,
      };

      await ctx.reply(
        `🎨 *Выберите иконку для каталога \"${catalogName}\":*` +
          '\n\nИли нажмите "❌ Без иконки" чтобы пропустить',
        {
          parse_mode: "Markdown",
          reply_markup: getIconsKeyboard(),
        }
      );
    } else {
      await next();
    }
  });

  bot.callbackQuery(/^icon_/, async (ctx) => {
    if (!ctx.session.creatingCatalog?.name) {
      await ctx.answerCallbackQuery("❌ Сессия устарела. Начните заново.");
      return;
    }

    const iconData = ctx.callbackQuery.data;
    const selectedIcon =
      iconData === "icon_null" ? undefined : iconData.replace("icon_", "");

    try {
      const user = await catalogService.getOrCreateUser(
        ctx.from!.id.toString(),
        ctx.from!.username,
      );

      const catalog = await catalogService.createCatalog({
        name: ctx.session.creatingCatalog.name,
        emoji: selectedIcon,
        userId: user.id,
      });

      ctx.session.creatingCatalog = undefined;

      const iconText = selectedIcon ? ` с иконкой ${selectedIcon}` : "";
      await ctx.editMessageText(
        `✅ *Каталог \"${catalog.name}\"${iconText} успешно создан!*\n\n` +
          "Теперь вы можете добавлять в него заметки 📝",
        { parse_mode: "Markdown" }
      );

      await ctx.reply("🎉 Что хотите сделать дальше?", {
        reply_markup: mainKeyboard,
      });
    } catch (error) {
      console.error("Error creating catalog:", error);
      await ctx.answerCallbackQuery("❌ Ошибка при создании каталога");
    }

    await ctx.answerCallbackQuery();
  });


  bot.callbackQuery(/^icons_page_/, async (ctx) => {
    const page = parseInt(ctx.callbackQuery.data.replace("icons_page_", ""));

    await ctx.editMessageReplyMarkup({
      reply_markup: getIconsKeyboard(page),
    });

    await ctx.answerCallbackQuery();
  });


  bot.callbackQuery("cancel_create_catalog", async (ctx) => {
    ctx.session.creatingCatalog = undefined;

    await ctx.editMessageText("❌ Создание каталога отменено");
    await ctx.reply("Что хотите сделать?", {
      reply_markup: mainKeyboard,
    });

    await ctx.answerCallbackQuery();
  });
}