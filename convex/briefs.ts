import { v } from "convex/values";

import { query } from "./_generated/server";
import { requirePropertyAccess, requireRegionAccess } from "./access";

function tokenizeQuery(query: string) {
  return Array.from(
    new Set(
      query
        .toLowerCase()
        .replace(/[^\w\s-]/g, " ")
        .split(/\s+/)
        .filter((token) => token.length >= 3)
    )
  );
}

function extractReferenceMatches(query: string) {
  const refs = query.match(/\b(?:LST|REG|PROP|TXN|ACT)-[A-Z0-9-]+\b/gi) ?? [];
  return new Set(refs.map((ref) => ref.toUpperCase()));
}

function rankListing(listing: any, tokens: string[], refs: Set<string>) {
  const haystack = [
    listing.listingId,
    listing.propertyId,
    listing.title,
    listing.description,
    listing.relatedRegulation,
    listing.type,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  let score = 0;
  if (refs.has(String(listing.listingId).toUpperCase())) score += 20;
  if (refs.has(String(listing.relatedRegulation ?? "").toUpperCase())) score += 12;
  if (refs.has(String(listing.propertyId ?? "").toUpperCase())) score += 8;
  if (listing.status !== "resolved") score += 3;
  if (listing.escalatedToPortfolio) score += 2;
  if (listing.severity === "critical") score += 6;
  if (listing.severity === "high") score += 4;

  for (const token of tokens) {
    if (haystack.includes(token)) {
      score += 2;
    }
  }

  return score;
}

function rankRegulation(regulation: any, tokens: string[], refs: Set<string>) {
  const haystack = [regulation.regulationId, regulation.title, regulation.content, regulation.category]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  let score = 0;
  if (refs.has(String(regulation.regulationId).toUpperCase())) score += 20;
  for (const token of tokens) {
    if (haystack.includes(token)) {
      score += 2;
    }
  }
  return score;
}

function rankMarketData(item: any, tokens: string[], refs: Set<string>) {
  const haystack = [item.propertyId, item.metric, item.source, item.period]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  let score = 0;
  if (refs.has(String(item.propertyId).toUpperCase())) score += 10;
  for (const token of tokens) {
    if (haystack.includes(token)) {
      score += 2;
    }
  }
  return score;
}

export const getAgentBrief = query({
  args: {
    operatorId: v.string(),
    query: v.string(),
    propertyId: v.optional(v.string()),
    regionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.propertyId) {
      await requirePropertyAccess(ctx, args.operatorId, args.propertyId);
    } else {
      await requireRegionAccess(ctx, args.operatorId, args.regionId ?? "Downtown");
    }

    const tokens = tokenizeQuery(args.query);
    const refs = extractReferenceMatches(args.query);
    const includeTransactions =
      /\bbefore\b|\bresolved\b|\bwhat happened\b|\bwhat worked\b|\bprecedent\b|\bhistorical\b|\bpast\b/i.test(
        args.query
      );
    const region = args.regionId ?? "Downtown";

    const properties = args.propertyId
      ? [
          await ctx.db
            .query("properties")
            .withIndex("by_propertyId", (q: any) => q.eq("propertyId", args.propertyId))
            .first(),
        ].filter(Boolean)
      : await ctx.db
          .query("properties")
          .withIndex("by_region", (q: any) => q.eq("region", region))
          .collect();

    const propertyIds = new Set(properties.map((p: any) => p.propertyId));
    let listings = await ctx.db.query("listings").collect();
    listings = listings.filter(
      (listing: any) =>
        args.propertyId ? listing.propertyId === args.propertyId : propertyIds.has(listing.propertyId)
    );

    const rankedListings = listings
      .map((listing: any) => ({ listing, score: rankListing(listing, tokens, refs) }))
      .filter((entry: any) => entry.score > 0)
      .sort((a: any, b: any) => b.score - a.score);

    const matchedListings = rankedListings.slice(0, 5).map((entry: any) => entry.listing);
    const matchedListingIds = new Set(matchedListings.map((l: any) => l.listingId));
    const relatedRegulationIds = new Set(
      matchedListings.map((l: any) => l.relatedRegulation).filter(Boolean)
    );

    const crossPropertyRelatedListings = listings
      .filter((l: any) => !matchedListingIds.has(l.listingId))
      .filter(
        (l: any) =>
          (l.relatedRegulation && relatedRegulationIds.has(l.relatedRegulation)) ||
          matchedListings.some((ml: any) => ml.type === l.type && ml.propertyId !== l.propertyId)
      )
      .slice(0, 6);

    const allRegulations = await ctx.db.query("regulations").collect();
    const regulations = allRegulations
      .map((reg: any) => ({
        regulation: reg,
        score:
          (relatedRegulationIds.has(reg.regulationId) ? 18 : 0) + rankRegulation(reg, tokens, refs),
      }))
      .filter((entry: any) => entry.score > 0)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 6)
      .map((entry: any) => entry.regulation);

    const marketData = args.propertyId
      ? await ctx.db
          .query("marketData")
          .withIndex("by_property", (q: any) => q.eq("propertyId", args.propertyId))
          .collect()
      : [];
    const marketHighlights = marketData
      .map((item: any) => ({ item, score: rankMarketData(item, tokens, refs) }))
      .filter((entry: any) => entry.score > 0)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 5)
      .map((entry: any) => entry.item);

    const maintenanceItems = args.propertyId
      ? (
          await ctx.db
            .query("maintenance")
            .withIndex("by_property", (q: any) => q.eq("propertyId", args.propertyId))
            .collect()
        ).filter((m: any) => m.status !== "completed")
      : [];

    const portfolioRisk = args.propertyId
      ? []
      : properties
          .map((p: any) => {
            const propListings = listings.filter(
              (l: any) => l.propertyId === p.propertyId && l.status !== "resolved"
            );
            const criticals = propListings.filter((l: any) => l.severity === "critical").length;
            const impact = propListings.reduce((sum: number, l: any) => sum + l.revenueImpact, 0);
            return { ...p, openListings: propListings.length, criticals, impact };
          })
          .filter((p: any) => p.openListings > 0 || p.occupancyRate < 0.85)
          .sort((a: any, b: any) => b.criticals - a.criticals || b.impact - a.impact)
          .slice(0, 5);

    const transactions = includeTransactions
      ? (await ctx.db.query("transactions").collect())
          .filter((txn: any) => {
            if (matchedListings.length === 0) {
              return tokens.some((token) =>
                `${txn.resolution} ${txn.lessonsLearned}`
                  .toLowerCase()
                  .includes(token)
              );
            }
            return matchedListings.some(
              (l: any) =>
                txn.type === l.type ||
                txn.regulationIds?.includes(l.relatedRegulation)
            );
          })
          .slice(0, 4)
      : [];

    const openListingCount = listings.filter((l: any) => l.status !== "resolved").length;
    const estimatedRevenueImpact = listings
      .filter((l: any) => l.status !== "resolved")
      .reduce((sum: number, l: any) => sum + (l.revenueImpact ?? 0), 0);

    return {
      scope: {
        propertyId: args.propertyId,
        regionId: region,
        openListingCount,
        estimatedRevenueImpact,
      },
      properties,
      matchedListings,
      crossPropertyRelatedListings,
      regulations,
      marketHighlights,
      maintenanceItems,
      portfolioRisk,
      transactions,
    };
  },
});
