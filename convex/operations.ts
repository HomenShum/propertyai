import { query } from "./_generated/server";
import { v } from "convex/values";
import { requirePropertyAccess, requireRegionAccess } from "./access";

export const getPropertySummary = query({
  args: { operatorId: v.string(), propertyId: v.string() },
  handler: async (ctx, args) => {
    await requirePropertyAccess(ctx, args.operatorId, args.propertyId);
    const property = await ctx.db
      .query("properties")
      .withIndex("by_propertyId", (q: any) => q.eq("propertyId", args.propertyId))
      .first();
    const listings = await ctx.db
      .query("listings")
      .withIndex("by_property", (q: any) => q.eq("propertyId", args.propertyId))
      .collect();
    const maintenanceItems = await ctx.db
      .query("maintenance")
      .withIndex("by_property", (q: any) => q.eq("propertyId", args.propertyId))
      .collect();
    const marketData = await ctx.db
      .query("marketData")
      .withIndex("by_property", (q: any) => q.eq("propertyId", args.propertyId))
      .collect();

    const openListings = listings.filter((l: any) => l.status !== "resolved");
    const upcomingMaintenance = maintenanceItems.filter((m: any) => m.status !== "completed");
    const leaseExpirations = listings.filter(
      (l: any) => l.type === "lease_renewal" && l.status !== "resolved"
    );

    return {
      propertyId: args.propertyId,
      property,
      openListingCount: openListings.length,
      criticalListingCount: openListings.filter((l: any) => l.severity === "critical").length,
      vacancyRisk: property ? (1 - property.occupancyRate) * 100 : 0,
      leaseExpirationCount: leaseExpirations.length,
      maintenanceDueCount: upcomingMaintenance.length,
      estimatedRevenueImpact: openListings.reduce(
        (sum: number, l: any) => sum + l.revenueImpact,
        0
      ),
      latestMarketData: marketData.slice(-5),
    };
  },
});

export const getPortfolioOverview = query({
  args: { operatorId: v.string(), region: v.string() },
  handler: async (ctx, args) => {
    await requireRegionAccess(ctx, args.operatorId, args.region);
    const properties = await ctx.db
      .query("properties")
      .withIndex("by_region", (q: any) => q.eq("region", args.region))
      .collect();
    const propertyIds = new Set(properties.map((p: any) => p.propertyId));
    const listings = (await ctx.db.query("listings").collect()).filter((l: any) =>
      propertyIds.has(l.propertyId)
    );
    const actionItems = (await ctx.db.query("actionItems").collect()).filter(
      (item: any) => item.regionId === args.region
    );
    const maintenanceItems = (await ctx.db.query("maintenance").collect()).filter((m: any) =>
      propertyIds.has(m.propertyId)
    );

    const openListings = listings.filter((l: any) => l.status !== "resolved");
    const listingTypeCounts = openListings.reduce((acc: Record<string, number>, l: any) => {
      acc[l.type] = (acc[l.type] ?? 0) + 1;
      return acc;
    }, {});

    const avgOccupancy =
      properties.length > 0
        ? properties.reduce((sum: number, p: any) => sum + p.occupancyRate, 0) / properties.length
        : 0;

    const totalPortfolioValue = properties.reduce(
      (sum: number, p: any) => sum + p.marketValue,
      0
    );

    const upcomingMaintenance = maintenanceItems.filter((m: any) => m.status !== "completed");
    const maintenanceCost = upcomingMaintenance.reduce(
      (sum: number, m: any) => sum + m.estimatedCost,
      0
    );

    return {
      region: args.region,
      propertyCount: properties.length,
      openListingCount: openListings.length,
      escalatedListingCount: openListings.filter((l: any) => l.escalatedToPortfolio).length,
      criticalListingCount: openListings.filter((l: any) => l.severity === "critical").length,
      actionItemCount: actionItems.filter((item: any) => item.status !== "completed").length,
      estimatedRevenueImpact: openListings.reduce(
        (sum: number, l: any) => sum + l.revenueImpact,
        0
      ),
      listingTypeCounts,
      avgOccupancy: Math.round(avgOccupancy * 100),
      totalPortfolioValue,
      maintenanceCost,
      upcomingMaintenanceCount: upcomingMaintenance.length,
    };
  },
});
