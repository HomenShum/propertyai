export async function requireOperator(ctx: any, operatorId: string) {
  const operator = await ctx.db
    .query("users")
    .withIndex("by_operatorId", (q: any) => q.eq("operatorId", operatorId))
    .first();

  if (!operator) {
    throw new Error("Operator session is missing or invalid.");
  }

  return operator;
}

export async function requirePropertyAccess(ctx: any, operatorId: string, propertyId: string) {
  const operator = await requireOperator(ctx, operatorId);

  if (operator.role === "portfolio_manager" || operator.role === "analyst") {
    const property = await ctx.db
      .query("properties")
      .withIndex("by_propertyId", (q: any) => q.eq("propertyId", propertyId))
      .first();
    if (!property || !operator.regionIds.includes(property.region)) {
      throw new Error(`Operator ${operator.name} cannot access property ${propertyId}.`);
    }
    return operator;
  }

  if (!operator.propertyIds.includes(propertyId)) {
    throw new Error(`Operator ${operator.name} cannot access property ${propertyId}.`);
  }

  return operator;
}

export async function requireRegionAccess(ctx: any, operatorId: string, region: string) {
  const operator = await requireOperator(ctx, operatorId);
  if (
    (operator.role !== "portfolio_manager" && operator.role !== "analyst") ||
    !operator.regionIds.includes(region)
  ) {
    // Brokers can still access region-level data if they have properties in that region
    if (operator.role === "broker") {
      const properties = await ctx.db
        .query("properties")
        .withIndex("by_region", (q: any) => q.eq("region", region))
        .take(1);
      const hasProperty = properties.some((p: any) => operator.propertyIds.includes(p.propertyId));
      if (hasProperty) return operator;
    }
    throw new Error(`Operator ${operator.name} cannot access region ${region}.`);
  }
  return operator;
}

export async function requireListingAccess(ctx: any, operatorId: string, listingId: string) {
  const listing = await ctx.db
    .query("listings")
    .withIndex("by_listingId", (q: any) => q.eq("listingId", listingId))
    .first();

  if (!listing) {
    throw new Error(`Listing ${listingId} not found.`);
  }

  await requirePropertyAccess(ctx, operatorId, listing.propertyId);

  return listing;
}
