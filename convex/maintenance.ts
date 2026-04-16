import { query } from "./_generated/server";
import { v } from "convex/values";
import { requirePropertyAccess } from "./access";

export const getByProperty = query({
  args: { operatorId: v.string(), propertyId: v.string() },
  handler: async (ctx, args) => {
    await requirePropertyAccess(ctx, args.operatorId, args.propertyId);
    return await ctx.db
      .query("maintenance")
      .withIndex("by_property", (q: any) => q.eq("propertyId", args.propertyId))
      .collect();
  },
});

export const getUpcoming = query({
  args: { operatorId: v.string(), propertyId: v.string() },
  handler: async (ctx, args) => {
    await requirePropertyAccess(ctx, args.operatorId, args.propertyId);
    const all = await ctx.db
      .query("maintenance")
      .withIndex("by_property", (q: any) => q.eq("propertyId", args.propertyId))
      .collect();
    return all
      .filter((m: any) => m.status !== "completed")
      .sort((a: any, b: any) => a.scheduledDate.localeCompare(b.scheduledDate));
  },
});
