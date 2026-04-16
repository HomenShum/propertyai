import { query } from "./_generated/server";
import { v } from "convex/values";
import { requirePropertyAccess } from "./access";

export const getByProperty = query({
  args: { propertyId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("marketData")
      .withIndex("by_property", (q: any) => q.eq("propertyId", args.propertyId))
      .collect();
  },
});

export const getByPropertyAndMetric = query({
  args: { propertyId: v.string(), metric: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("marketData")
      .withIndex("by_property_metric", (q: any) =>
        q.eq("propertyId", args.propertyId).eq("metric", args.metric)
      )
      .collect();
  },
});
