import { Bot } from "grammy";
import { MyContext } from "../../types";
import {
  setupForwardedMessageHandler,
  setupTextMessageHandler,
  setupPhotoMessageHandler,
  setupVoiceMessageHandler,
  setupNoteActions,
} from "./note";

export function setupNoteHandlers(bot: Bot<MyContext>) {
  setupNoteActions(bot);
  setupForwardedMessageHandler(bot);
  setupTextMessageHandler(bot);
  setupPhotoMessageHandler(bot);
  setupVoiceMessageHandler(bot);
}
