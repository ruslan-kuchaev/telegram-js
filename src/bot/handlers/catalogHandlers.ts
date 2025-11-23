import { Bot, Context } from "grammy";
import { CatalogService } from "../../services/CatalogService";
import { mainKeyboard, getIconsKeyboard, cancelKeyboard } from "../keyboards";

interface SessionData {
  creatingCatalog?: {
    step: "waiting_name" | "waiting_icon";
    name?: string;
  };
}

type MyContext = Context & {
  session: SessionData;
};

export function setupCatalogHandlers(bot: Bot<MyContext>) {
  const catalogService = new CatalogService();

  bot.hears("📂 Создать каталог", async (ctx) => {
    ctx.session.creatingCatalog = {
      step: "waiting_name",
    };

    await ctx.reply(
      "📝 *Введите название для нового каталога:*\n\n" +
        "Можно использовать emoji в названии 🎯",
      {
        parse_mode: "Markdown",
        reply_markup: cancelKeyboard,
      }
    );
  });

  bot.on("message:text", async (ctx) => {
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
        ctx.from!.first_name,
        ctx.from!.last_name
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

    const catalogsList = userCatalogs
      .map((catalog) => `${catalog.emoji || "📁"} ${catalog.name}`)
      .join("\n");

    await ctx.reply(`📂 *Ваши каталоги:*\n\n${catalogsList}`, {
      parse_mode: "Markdown",
      reply_markup: mainKeyboard,
    });
  });
}
