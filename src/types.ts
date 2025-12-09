import { Context, SessionFlavor } from "grammy";

export interface SessionData {
  creatingCatalog?: {
    step: "waiting_name" | "waiting_icon";
    name?: string;
  };
  creatingNote?: {
    step: "selecting_catalog" | "waiting_content";
    catalogId?: number;
  };
  botMessages?: number[]; // ID сообщений бота для удаления
  mediaGroups?: {
    [groupId: string]: {
      messages: any[];
      timer: NodeJS.Timeout;
      catalogId: number;
    };
  };
}

export type MyContext = Context & SessionFlavor<SessionData>;
