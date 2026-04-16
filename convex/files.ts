import { v } from "convex/values";

import { requireOperator, requirePropertyAccess, requireRegionAccess } from "./access";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

function inferFileCategory(mimeType: string) {
  if (mimeType.startsWith("image/")) {
    return "image";
  }
  if (mimeType.startsWith("video/")) {
    return "video";
  }
  if (
    mimeType.startsWith("text/") ||
    mimeType === "application/pdf" ||
    mimeType.includes("word") ||
    mimeType.includes("sheet") ||
    mimeType.includes("presentation") ||
    mimeType.includes("json")
  ) {
    return "document";
  }
  return "other";
}

async function nextFileId(ctx: any) {
  const existing = await ctx.db.query("files").collect();
  const nextNumber =
    existing
      .map((file: any) => Number(String(file.fileId).replace("FILE-", "")))
      .filter((value: number) => !Number.isNaN(value))
      .reduce((max: number, value: number) => Math.max(max, value), 0) + 1;
  return `FILE-${String(nextNumber).padStart(3, "0")}`;
}

async function hydrateFilesWithUrls(ctx: any, files: any[]) {
  return await Promise.all(
    files.map(async (file) => ({
      ...file,
      url: file.storageId ? await ctx.storage.getUrl(file.storageId) : null,
    }))
  );
}

export const generateUploadUrl = mutation({
  args: { operatorId: v.string() },
  handler: async (ctx, args) => {
    await requireOperator(ctx, args.operatorId);
    return await ctx.storage.generateUploadUrl();
  },
});

export const create = mutation({
  args: {
    operatorId: v.string(),
    listingId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    propertyId: v.optional(v.string()),
    regionId: v.optional(v.string()),
    filename: v.string(),
    mimeType: v.string(),
    sizeBytes: v.number(),
    storageId: v.id("_storage"),
    uploadedBy: v.string(),
    analysisStatus: v.optional(v.string()),
    summary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.propertyId) {
      await requirePropertyAccess(ctx, args.operatorId, args.propertyId);
    }
    if (args.regionId) {
      await requireRegionAccess(ctx, args.operatorId, args.regionId);
    }
    const fileId = await nextFileId(ctx);
    await ctx.db.insert("files", {
      fileId,
      listingId: args.listingId,
      sessionId: args.sessionId,
      propertyId: args.propertyId,
      regionId: args.regionId,
      filename: args.filename,
      mimeType: args.mimeType,
      fileCategory: inferFileCategory(args.mimeType),
      sizeBytes: args.sizeBytes,
      storageId: args.storageId,
      uploadedBy: args.uploadedBy,
      uploadedAt: new Date().toISOString(),
      analysisStatus: args.analysisStatus ?? "uploaded",
      summary: args.summary,
    });
    await ctx.runMutation(internal.audit.record, {
      actorId: args.operatorId,
      eventType: "file.uploaded",
      status: "success",
      propertyId: args.propertyId,
      regionId: args.regionId,
      entityId: fileId,
      summary: `Uploaded ${args.filename}.`,
      detailsJson: JSON.stringify({
        mimeType: args.mimeType,
        sizeBytes: args.sizeBytes,
      }),
    });
    return {
      fileId,
      filename: args.filename,
      mimeType: args.mimeType,
      fileCategory: inferFileCategory(args.mimeType),
      sizeBytes: args.sizeBytes,
    };
  },
});

export const getByListing = query({
  args: { operatorId: v.string(), listingId: v.string() },
  handler: async (ctx, args) => {
    const listing = await ctx.db
      .query("listings")
      .withIndex("by_listingId", (q: any) => q.eq("listingId", args.listingId))
      .first();
    if (listing?.propertyId) {
      await requirePropertyAccess(ctx, args.operatorId, listing.propertyId);
    }
    const files = await ctx.db
      .query("files")
      .withIndex("by_listing", (q) => q.eq("listingId", args.listingId))
      .collect();
    return await hydrateFilesWithUrls(ctx, files);
  },
});

export const getBySession = query({
  args: {
    operatorId: v.string(),
    sessionId: v.string(),
    propertyId: v.optional(v.string()),
    regionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.propertyId) {
      await requirePropertyAccess(ctx, args.operatorId, args.propertyId);
    }
    if (args.regionId) {
      await requireRegionAccess(ctx, args.operatorId, args.regionId);
    }
    const files = await ctx.db
      .query("files")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();
    return await hydrateFilesWithUrls(ctx, files);
  },
});

export const getByIds = query({
  args: {
    operatorId: v.string(),
    fileIds: v.array(v.string()),
    propertyId: v.optional(v.string()),
    regionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.propertyId) {
      await requirePropertyAccess(ctx, args.operatorId, args.propertyId);
    }
    if (args.regionId) {
      await requireRegionAccess(ctx, args.operatorId, args.regionId);
    }
    if (args.fileIds.length === 0) {
      return [];
    }
    const wanted = new Set(args.fileIds);
    const files = (await ctx.db.query("files").collect()).filter((file: any) =>
      wanted.has(file.fileId)
    );
    return await hydrateFilesWithUrls(ctx, files);
  },
});

export const listByListingIds = query({
  args: {
    operatorId: v.string(),
    listingIds: v.array(v.string()),
    propertyId: v.optional(v.string()),
    regionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.propertyId) {
      await requirePropertyAccess(ctx, args.operatorId, args.propertyId);
    }
    if (args.regionId) {
      await requireRegionAccess(ctx, args.operatorId, args.regionId);
    }
    if (args.listingIds.length === 0) {
      return [];
    }
    const wanted = new Set(args.listingIds);
    const files = (await ctx.db.query("files").collect()).filter(
      (file: any) => file.listingId && wanted.has(file.listingId)
    );
    return await hydrateFilesWithUrls(ctx, files);
  },
});

export const remove = mutation({
  args: { operatorId: v.string(), fileId: v.string() },
  handler: async (ctx, args) => {
    const file = await ctx.db
      .query("files")
      .withIndex("by_fileId", (q) => q.eq("fileId", args.fileId))
      .first();
    if (!file) {
      throw new Error(`File ${args.fileId} not found.`);
    }
    if (file.propertyId) {
      await requirePropertyAccess(ctx, args.operatorId, file.propertyId);
    }
    if (file.regionId) {
      await requireRegionAccess(ctx, args.operatorId, file.regionId);
    }
    if (file.storageId) {
      await ctx.storage.delete(file.storageId as Id<"_storage">);
    }
    await ctx.db.delete(file._id);
    await ctx.runMutation(internal.audit.record, {
      actorId: args.operatorId,
      eventType: "file.removed",
      status: "success",
      propertyId: file.propertyId,
      regionId: file.regionId,
      entityId: file.fileId,
      summary: `Removed ${file.filename}.`,
    });
    return { fileId: args.fileId };
  },
});
