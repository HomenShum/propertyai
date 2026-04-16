import { query } from "./_generated/server";
import { v } from "convex/values";
import { requirePropertyAccess, requireRegionAccess } from "./access";

export const getAll = query({
  args: { operatorId: v.string() },
  handler: async (ctx, args) => {
    await requireRegionAccess(ctx, args.operatorId, "Downtown");
    return await ctx.db.query("properties").collect();
  },
});

export const getByRegion = query({
  args: { operatorId: v.string(), region: v.string() },
  handler: async (ctx, args) => {
    await requireRegionAccess(ctx, args.operatorId, args.region);
    return await ctx.db
      .query("properties")
      .withIndex("by_region", (q: any) => q.eq("region", args.region))
      .collect();
  },
});

export const getById = query({
  args: { operatorId: v.string(), propertyId: v.string() },
  handler: async (ctx, args) => {
    await requirePropertyAccess(ctx, args.operatorId, args.propertyId);
    return await ctx.db
      .query("properties")
      .withIndex("by_propertyId", (q: any) => q.eq("propertyId", args.propertyId))
      .first();
  },
});
