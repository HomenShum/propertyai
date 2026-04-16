import { query } from "./_generated/server";
import { v } from "convex/values";

export const search = query({
  args: {
    regulationId: v.optional(v.string()),
    keyword: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.regulationId) {
      const result = await ctx.db
        .query("regulations")
        .withIndex("by_regulationId", (q: any) => q.eq("regulationId", args.regulationId))
        .first();
      return result ? [result] : [];
    }
    if (args.keyword) {
      const results = await ctx.db
        .query("regulations")
        .withSearchIndex("search_content", (q: any) => q.search("content", args.keyword!))
        .take(10);
      return results;
    }
    return await ctx.db.query("regulations").take(20);
  },
});
