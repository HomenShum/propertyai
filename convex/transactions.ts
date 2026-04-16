import { query } from "./_generated/server";
import { v } from "convex/values";

export const search = query({
  args: {
    type: v.optional(v.string()),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const maxResults = args.limit ?? 5;
    if (args.query) {
      let results = await ctx.db
        .query("transactions")
        .withSearchIndex("search_resolution", (q: any) => {
          const base = q.search("resolution", args.query);
          return args.type ? base.eq("type", args.type) : base;
        })
        .take(maxResults);
      if (results.length > 0) {
        return results;
      }
    }
    if (args.type) {
      return await ctx.db
        .query("transactions")
        .withIndex("by_type", (q: any) => q.eq("type", args.type))
        .take(maxResults);
    }
    return await ctx.db.query("transactions").take(maxResults);
  },
});
