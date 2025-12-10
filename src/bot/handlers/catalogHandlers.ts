import { Bot } from "grammy";
import { MyContext } from "../../types";
import {
  setupCreateCatalogHandler,
  setupViewCatalogsHandler
} from "./catalog";

export function setupCatalogHandlers(bot: Bot<MyContext>) {
  setupCreateCatalogHandler(bot);
  setupViewCatalogsHandler(bot);
}
