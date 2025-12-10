import { MyContext } from "../types";

export async function botClear(ctx : MyContext){
    for (let i = 0; i < 10; i++) {
    await ctx.reply("🧹");
  }
}