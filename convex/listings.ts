import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { requireListingAccess, requirePropertyAccess, requireRegionAccess } from "./access";

export const getById = query({
  args: { operatorId: v.string(), listingId: v.string() },
  handler: async (ctx, args) => {
    await requireListingAccess(ctx, args.operatorId, args.listingId);
    return await ctx.db
      .query("listings")
      .withIndex("by_listingId", (q: any) => q.eq("listingId", args.listingId))
      .first();
  },
});

export const getByProperty = query({
  args: { operatorId: v.string(), propertyId: v.string() },
  handler: async (ctx, args) => {
    await requirePropertyAccess(ctx, args.operatorId, args.propertyId);
    return await ctx.db
      .query("listings")
      .withIndex("by_property", (q: any) => q.eq("propertyId", args.propertyId))
      .collect();
  },
});

export const getAll = query({
  args: { operatorId: v.string() },
  handler: async (ctx, args) => {
    await requireRegionAccess(ctx, args.operatorId, "Downtown");
    return await ctx.db.query("listings").collect();
  },
});

export const search = query({
  args: {
    operatorId: v.string(),
    propertyId: v.optional(v.string()),
    type: v.optional(v.string()),
    severity: v.optional(v.string()),
    status: v.optional(v.string()),
    keyword: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.propertyId && args.propertyId !== "ALL") {
      await requirePropertyAccess(ctx, args.operatorId, args.propertyId);
    } else {
      await requireRegionAccess(ctx, args.operatorId, "Downtown");
    }
    let results = await ctx.db.query("listings").collect();
    if (args.propertyId && args.propertyId !== "ALL") {
      results = results.filter((l: any) => l.propertyId === args.propertyId);
    }
    if (args.type) {
      results = results.filter((l: any) => l.type === args.type);
    }
    if (args.severity) {
      results = results.filter((l: any) => l.severity === args.severity);
    }
    if (args.status) {
      results = results.filter((l: any) => l.status === args.status);
    }
    if (args.keyword) {
      const needle = args.keyword.toLowerCase();
      results = results.filter(
        (l: any) =>
          l.title.toLowerCase().includes(needle) ||
          l.description.toLowerCase().includes(needle) ||
          l.listingId.toLowerCase().includes(needle) ||
          (l.relatedRegulation?.toLowerCase().includes(needle) ?? false)
      );
    }
    return results;
  },
});

export const create = mutation({
  args: {
    operatorId: v.string(),
    propertyId: v.string(),
    title: v.string(),
    description: v.string(),
    type: v.string(),
    severity: v.string(),
    reporterName: v.string(),
    reporterRole: v.string(),
    relatedRegulation: v.optional(v.string()),
    revenueImpact: v.number(),
  },
  handler: async (ctx, args) => {
    await requirePropertyAccess(ctx, args.operatorId, args.propertyId);
    const existing = await ctx.db.query("listings").collect();
    const nextNumber =
      existing
        .map((listing: any) => Number(String(listing.listingId).replace("LST-", "")))
        .filter((value) => !Number.isNaN(value))
        .reduce((max, value) => Math.max(max, value), 0) + 1;
    const listingId = `LST-${String(nextNumber).padStart(3, "0")}`;
    await ctx.db.insert("listings", {
      listingId,
      propertyId: args.propertyId,
      type: args.type,
      severity: args.severity,
      title: args.title,
      description: args.description,
      status: "open",
      createdAt: new Date().toISOString(),
      escalatedToPortfolio: args.severity === "critical",
      relatedRegulation: args.relatedRegulation,
      revenueImpact: args.revenueImpact,
      reportedByRole: args.reporterRole,
      reporterName: args.reporterName,
    });
    await ctx.runMutation(internal.audit.record, {
      actorId: args.operatorId,
      eventType: "listing.created",
      status: "success",
      propertyId: args.propertyId,
      entityId: listingId,
      summary: `Created listing ${listingId} for ${args.propertyId}.`,
      detailsJson: JSON.stringify({
        severity: args.severity,
        type: args.type,
        revenueImpact: args.revenueImpact,
      }),
    });
    return { listingId };
  },
});

export const updateStatus = mutation({
  args: {
    operatorId: v.string(),
    listingId: v.string(),
    status: v.string(),
    resolutionNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const listing = await requireListingAccess(ctx, args.operatorId, args.listingId);
    const result = await ctx.db.patch(listing._id, {
      status: args.status,
      resolvedAt: args.status === "resolved" ? new Date().toISOString() : undefined,
      resolutionNotes: args.resolutionNotes,
    });
    await ctx.runMutation(internal.audit.record, {
      actorId: args.operatorId,
      eventType: "listing.status_updated",
      status: "success",
      propertyId: listing.propertyId,
      entityId: listing.listingId,
      summary: `Changed ${listing.listingId} to ${args.status}.`,
    });
    return result;
  },
});

export const escalate = mutation({
  args: {
    operatorId: v.string(),
    listingId: v.string(),
  },
  handler: async (ctx, args) => {
    const listing = await requireListingAccess(ctx, args.operatorId, args.listingId);
    const result = await ctx.db.patch(listing._id, {
      escalatedToPortfolio: true,
      severity: listing.severity === "critical" ? listing.severity : "high",
    });
    await ctx.runMutation(internal.audit.record, {
      actorId: args.operatorId,
      eventType: "listing.escalated",
      status: "success",
      propertyId: listing.propertyId,
      entityId: listing.listingId,
      summary: `Escalated ${listing.listingId} to portfolio review.`,
    });
    return result;
  },
});
