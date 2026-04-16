import { mutation } from "./_generated/server";

export const seedAll = mutation({
  args: {},
  handler: async (ctx) => {
    const hasUsers = Boolean(await ctx.db.query("users").first());
    const hasProperties = Boolean(await ctx.db.query("properties").first());
    const hasListings = Boolean(await ctx.db.query("listings").first());
    const hasMarketData = Boolean(await ctx.db.query("marketData").first());
    const hasMaintenance = Boolean(await ctx.db.query("maintenance").first());
    const hasRegulations = Boolean(await ctx.db.query("regulations").first());
    const hasTransactions = Boolean(await ctx.db.query("transactions").first());
    const hasActionItems = Boolean(await ctx.db.query("actionItems").first());

    // === USERS ===
    const users = [
      {
        operatorId: "OP-BRK-101",
        name: "Maria Chen",
        email: "maria.chen@propertyai.local",
        role: "broker",
        propertyIds: ["PROP-101", "PROP-102", "PROP-103", "PROP-104"],
        regionIds: ["Downtown"],
      },
      {
        operatorId: "OP-BRK-102",
        name: "James Park",
        email: "james.park@propertyai.local",
        role: "broker",
        propertyIds: ["PROP-105", "PROP-106", "PROP-107", "PROP-108"],
        regionIds: ["Suburban"],
      },
      {
        operatorId: "OP-PM-001",
        name: "Rachel Torres",
        email: "rachel.torres@propertyai.local",
        role: "portfolio_manager",
        propertyIds: [],
        regionIds: ["Downtown", "Suburban"],
      },
      {
        operatorId: "OP-ANL-001",
        name: "Alex Kim",
        email: "alex.kim@propertyai.local",
        role: "analyst",
        propertyIds: [],
        regionIds: ["Downtown", "Suburban"],
      },
    ];
    if (!hasUsers) {
      for (const user of users) await ctx.db.insert("users", user);
    }

    // === PROPERTIES ===
    const properties = [
      { propertyId: "PROP-101", name: "One Financial Plaza", address: "100 Pearl St, Hartford, CT 06103", type: "office", sqft: 285000, yearBuilt: 1985, marketValue: 42000000, occupancyRate: 0.87, capRate: 6.2, zoning: "B-3 Commercial", region: "Downtown", assignedBrokerId: "OP-BRK-101" },
      { propertyId: "PROP-102", name: "Riverside Retail Center", address: "55 River Rd, Stamford, CT 06902", type: "retail", sqft: 64000, yearBuilt: 2001, marketValue: 14500000, occupancyRate: 0.92, capRate: 5.8, zoning: "C-1 Retail", region: "Downtown", assignedBrokerId: "OP-BRK-101" },
      { propertyId: "PROP-103", name: "Harbor Industrial Park", address: "310 Harbor Rd, Bridgeport, CT 06604", type: "industrial", sqft: 180000, yearBuilt: 1972, marketValue: 18000000, occupancyRate: 0.95, capRate: 7.1, zoning: "M-2 Industrial", region: "Downtown", assignedBrokerId: "OP-BRK-101" },
      { propertyId: "PROP-104", name: "Metro Mixed-Use Tower", address: "400 Main St, Hartford, CT 06103", type: "mixed", sqft: 320000, yearBuilt: 2018, marketValue: 78000000, occupancyRate: 0.82, capRate: 5.4, zoning: "MX-1 Mixed Use", region: "Downtown", assignedBrokerId: "OP-BRK-101" },
      { propertyId: "PROP-105", name: "Westfield Office Park", address: "120 Westfield Rd, Meriden, CT 06450", type: "office", sqft: 95000, yearBuilt: 1998, marketValue: 12000000, occupancyRate: 0.73, capRate: 7.5, zoning: "B-2 Commercial", region: "Suburban", assignedBrokerId: "OP-BRK-102" },
      { propertyId: "PROP-106", name: "College Town Plaza", address: "201 College St, New Haven, CT 06510", type: "retail", sqft: 48000, yearBuilt: 2010, marketValue: 11200000, occupancyRate: 0.88, capRate: 6.0, zoning: "C-2 Retail", region: "Suburban", assignedBrokerId: "OP-BRK-102" },
      { propertyId: "PROP-107", name: "Lakeside Warehouse Complex", address: "88 Lake Ave, West Hartford, CT 06107", type: "industrial", sqft: 220000, yearBuilt: 1965, marketValue: 16500000, occupancyRate: 0.98, capRate: 7.8, zoning: "M-1 Light Industrial", region: "Suburban", assignedBrokerId: "OP-BRK-102" },
      { propertyId: "PROP-108", name: "Elm Street Professional Center", address: "78 Elm St, New Haven, CT 06510", type: "office", sqft: 72000, yearBuilt: 2005, marketValue: 15800000, occupancyRate: 0.91, capRate: 6.3, zoning: "B-3 Commercial", region: "Suburban", assignedBrokerId: "OP-BRK-102" },
    ];
    if (!hasProperties) {
      for (const p of properties) await ctx.db.insert("properties", p);
    }

    // === LISTINGS ===
    const listings = [
      { listingId: "LST-001", propertyId: "PROP-101", type: "tenant_issue", severity: "high", title: "Anchor tenant signaling early lease termination", description: "Hartford Financial Group (floors 8-12, 42% of NRA) has notified intent to exercise early termination clause effective Q4 2026. Estimated $2.1M annual revenue at risk. Need retention strategy and backfill analysis.", status: "open", revenueImpact: 2100000, createdAt: "2026-04-12T09:15:00Z", escalatedToPortfolio: true, relatedRegulation: "REG-LEASE-001", reportedByRole: "broker", reporterName: "Maria Chen" },
      { listingId: "LST-002", propertyId: "PROP-102", type: "lease_renewal", severity: "medium", title: "Three retail leases expiring within 90 days", description: "Starbucks (Suite 101), Verizon (Suite 205), and FastFit Gym (Suite 110) all expire by July 2026. Combined 18,200 sqft representing 28% of total leasable area. Market rents have increased 12% since original leases.", status: "open", revenueImpact: 340000, createdAt: "2026-04-11T14:00:00Z", escalatedToPortfolio: false, relatedRegulation: "REG-LEASE-001", reportedByRole: "broker", reporterName: "Maria Chen" },
      { listingId: "LST-003", propertyId: "PROP-103", type: "inspection", severity: "critical", title: "Environmental Phase II assessment required — soil contamination indicators", description: "Phase I ESA flagged recognized environmental conditions (RECs) in loading dock area. Underground storage tanks from pre-1985 operations. Phase II boring and lab analysis required before any refinancing or sale. Estimated remediation cost $150K-$400K.", status: "open", revenueImpact: 400000, createdAt: "2026-04-12T06:45:00Z", escalatedToPortfolio: true, relatedRegulation: "REG-ENV-001", reportedByRole: "broker", reporterName: "Maria Chen" },
      { listingId: "LST-004", propertyId: "PROP-104", type: "due_diligence", severity: "high", title: "Zoning variance needed for rooftop amenity build-out", description: "Proposed rooftop terrace and fitness center requires MX-1 variance for outdoor assembly use above 20th floor. Planning commission hearing scheduled for May 15. Neighboring building has filed preliminary objection.", status: "in_progress", revenueImpact: 0, createdAt: "2026-04-10T13:00:00Z", escalatedToPortfolio: false, relatedRegulation: "REG-ZONE-002", reportedByRole: "broker", reporterName: "Maria Chen" },
      { listingId: "LST-005", propertyId: "PROP-105", type: "market_alert", severity: "high", title: "Competing office park offering 18 months free rent", description: "NewBridge Office Campus (1.2 miles away) is advertising 18 months free rent on 5-year terms to fill 120K sqft of vacancy. Our property already at 73% occupancy. Three prospect tours cancelled this week citing competitor pricing.", status: "open", revenueImpact: 680000, createdAt: "2026-04-12T08:00:00Z", escalatedToPortfolio: true, reportedByRole: "broker", reporterName: "James Park" },
      { listingId: "LST-006", propertyId: "PROP-104", type: "tenant_issue", severity: "medium", title: "Ground floor restaurant — HVAC complaints from upper floors", description: "Kitchen exhaust from Osteria Del Porto causing odor complaints from floors 2-4. Building management has received 12 complaints in 30 days. Tenant lease allows restaurant use but doesn't specify exhaust requirements. HVAC consultant engaged.", status: "in_progress", revenueImpact: 0, createdAt: "2026-04-09T07:00:00Z", escalatedToPortfolio: false, relatedRegulation: "REG-FIRE-001", reportedByRole: "broker", reporterName: "Maria Chen" },
      { listingId: "LST-007", propertyId: "PROP-106", type: "lease_renewal", severity: "low", title: "Bookstore requesting rent reduction at renewal", description: "Chapter & Verse Books (Suite 104, 3,200 sqft) requesting 15% rent reduction citing online competition. Current rent $32/sqft, market rate $35/sqft. Tenant has been in place 8 years with no late payments. Good foot traffic generator.", status: "open", revenueImpact: 15360, createdAt: "2026-04-10T16:00:00Z", escalatedToPortfolio: false, relatedRegulation: "REG-LEASE-001", reportedByRole: "broker", reporterName: "James Park" },
      { listingId: "LST-008", propertyId: "PROP-107", type: "inspection", severity: "medium", title: "Fire suppression system upgrade due — pre-1980 sprinklers", description: "Annual fire inspection noted 22 sprinkler heads with original 1965 installation. Fire marshal issued advisory: full system replacement recommended within 12 months. Insurance carrier may increase premium if not addressed.", status: "open", revenueImpact: 85000, createdAt: "2026-04-11T11:00:00Z", escalatedToPortfolio: false, relatedRegulation: "REG-FIRE-001", reportedByRole: "broker", reporterName: "James Park" },
      { listingId: "LST-009", propertyId: "PROP-101", type: "due_diligence", severity: "medium", title: "Elevator modernization — 3 of 6 cars exceed maintenance budget", description: "Cars 2, 4, and 5 averaging $18K/month in repair costs (budget: $8K). Modernization bid from KONE: $2.4M for all 6 cars, 14-month project. Tenant satisfaction scores dropped 22 points on vertical transport.", status: "open", revenueImpact: 120000, createdAt: "2026-04-10T09:00:00Z", escalatedToPortfolio: false, reportedByRole: "broker", reporterName: "Maria Chen" },
      { listingId: "LST-010", propertyId: "PROP-108", type: "market_alert", severity: "low", title: "New medical office demand surge in New Haven corridor", description: "Yale New Haven Health expanding outpatient network. Three RFPs issued for 15K-25K sqft medical office space within 2 miles. Our building is ADA-compliant and near transit. Potential re-tenanting opportunity for vacant 2nd floor.", status: "open", revenueImpact: 0, createdAt: "2026-04-12T11:00:00Z", escalatedToPortfolio: false, reportedByRole: "broker", reporterName: "James Park" },
      { listingId: "LST-011", propertyId: "PROP-102", type: "tenant_issue", severity: "critical", title: "Water intrusion — retail suites 103-106 closed", description: "Roof membrane failure during April storms caused water damage to 4 retail suites. Tenants displaced, inventory damage claims pending. Emergency tarping complete. Full roof replacement needed: $380K estimate. Insurance claim filed.", status: "open", revenueImpact: 520000, createdAt: "2026-04-12T04:20:00Z", escalatedToPortfolio: true, relatedRegulation: "REG-MAINT-001", reportedByRole: "broker", reporterName: "Maria Chen" },
      { listingId: "LST-012", propertyId: "PROP-105", type: "tenant_issue", severity: "low", title: "Parking ratio below tenant expectations — visitor complaints", description: "Current ratio 3.2:1000 sqft vs market standard 4.0:1000. Two tenants have cited parking in lease negotiation pushback. Adjacent lot available for lease at $45K/year which would bring ratio to 4.1:1000.", status: "open", revenueImpact: 0, createdAt: "2026-04-08T09:00:00Z", escalatedToPortfolio: false, reportedByRole: "broker", reporterName: "James Park" },
      { listingId: "LST-013", propertyId: "PROP-103", type: "lease_renewal", severity: "medium", title: "Major warehouse tenant requesting expansion options", description: "LogiFlow Inc (65K sqft, floors 1-2) inquiring about expanding into adjacent vacant bay (22K sqft). Current lease expires Dec 2027. Willing to extend 7 years if expansion approved. Would bring occupancy to 100%.", status: "in_progress", revenueImpact: 0, createdAt: "2026-04-11T15:30:00Z", escalatedToPortfolio: false, relatedRegulation: "REG-LEASE-001", reportedByRole: "broker", reporterName: "Maria Chen" },
      { listingId: "LST-014", propertyId: "PROP-104", type: "due_diligence", severity: "high", title: "Property tax assessment appeal deadline approaching", description: "2026 assessment increased 18% to $78M vs prior $66M. Appeal deadline May 1. Comparable sales analysis suggests fair value closer to $70M. Tax impact: $156K/year additional if not appealed. Outside counsel engaged.", status: "open", revenueImpact: 156000, createdAt: "2026-04-09T10:00:00Z", escalatedToPortfolio: true, relatedRegulation: "REG-TAX-001", reportedByRole: "broker", reporterName: "Maria Chen" },
      { listingId: "LST-015", propertyId: "PROP-106", type: "inspection", severity: "medium", title: "ADA compliance gap — parking lot and entrance", description: "Accessibility audit found 4 deficiencies: inadequate van-accessible spaces, non-compliant slope at main entrance, missing tactile signage in elevator, and restroom grab bar height. Remediation estimate: $45K.", status: "open", revenueImpact: 0, createdAt: "2026-04-10T12:00:00Z", escalatedToPortfolio: false, relatedRegulation: "REG-ADA-001", reportedByRole: "broker", reporterName: "James Park" },
      { listingId: "LST-016", propertyId: "PROP-107", type: "market_alert", severity: "medium", title: "Industrial vacancy rate dropping — opportunity to raise rents", description: "West Hartford industrial submarket vacancy dropped from 6.2% to 3.8% YoY. Our property at 98% occupancy with below-market rents ($6.50/sqft vs market $8.20/sqft). Three leases renewing in next 6 months.", status: "open", revenueImpact: 0, createdAt: "2026-04-11T08:00:00Z", escalatedToPortfolio: false, reportedByRole: "broker", reporterName: "James Park" },
      { listingId: "LST-017", propertyId: "PROP-101", type: "tenant_issue", severity: "medium", title: "Building security system upgrade overdue — access control failures", description: "Card reader failures averaging 3 per week across 4 entrance points. After-hours access logs incomplete. Security vendor contract expires June 30. Three proposals received for modern biometric + mobile access system.", status: "in_progress", revenueImpact: 0, createdAt: "2026-04-10T10:00:00Z", escalatedToPortfolio: false, relatedRegulation: "REG-FIRE-001", reportedByRole: "broker", reporterName: "Maria Chen" },
      { listingId: "LST-018", propertyId: "PROP-108", type: "due_diligence", severity: "low", title: "Energy audit reveals HVAC inefficiency — potential LEED opportunity", description: "Energy Star score dropped to 52 (was 68). HVAC system is 19 years old. Full replacement with high-efficiency VRF system: $1.2M. Projected energy savings: $180K/year. Potential LEED Silver certification could command $3-5/sqft premium.", status: "open", revenueImpact: 0, createdAt: "2026-04-09T10:00:00Z", escalatedToPortfolio: false, reportedByRole: "broker", reporterName: "James Park" },
      { listingId: "LST-019", propertyId: "PROP-105", type: "due_diligence", severity: "high", title: "Portfolio cross-property vacancy pattern — suburban office softening", description: "Downtown occupancy stable at 89% avg. Suburban office portfolio dropped from 84% to 77% in 6 months. Three suburban properties (PROP-105, PROP-108, and competitor assets) losing tenants to downtown flight. Need strategic repositioning plan.", status: "open", revenueImpact: 850000, createdAt: "2026-04-12T11:00:00Z", escalatedToPortfolio: true, reportedByRole: "portfolio_manager", reporterName: "Rachel Torres" },
      { listingId: "LST-020", propertyId: "PROP-101", type: "lease_renewal", severity: "low", title: "Cafeteria operator requesting lease restructure", description: "Ground floor cafeteria (2,800 sqft) requesting percentage rent structure instead of fixed $28/sqft. Proposes 8% of gross sales (est. equivalent to $22/sqft). Tenant provides amenity value for office tenants.", status: "open", revenueImpact: 16800, createdAt: "2026-04-08T10:00:00Z", escalatedToPortfolio: false, relatedRegulation: "REG-LEASE-001", reportedByRole: "broker", reporterName: "Maria Chen" },
    ];
    if (!hasListings) {
      for (const l of listings) await ctx.db.insert("listings", l as any);
    }

    // === MARKET DATA ===
    const marketDataEntries = [
      // PROP-101 comps and trends
      { propertyId: "PROP-101", metric: "comp_sale", value: 148, period: "2026-Q1", source: "CoStar" },
      { propertyId: "PROP-101", metric: "comp_sale", value: 152, period: "2025-Q4", source: "CoStar" },
      { propertyId: "PROP-101", metric: "rental_rate", value: 34.50, period: "2026-Q1", source: "CBRE Market Report" },
      { propertyId: "PROP-101", metric: "vacancy_rate", value: 13.0, period: "2026-Q1", source: "JLL Research" },
      { propertyId: "PROP-101", metric: "cap_rate_trend", value: 6.2, period: "2026-Q1", source: "NCREIF" },
      // PROP-102
      { propertyId: "PROP-102", metric: "comp_sale", value: 227, period: "2026-Q1", source: "CoStar" },
      { propertyId: "PROP-102", metric: "rental_rate", value: 38.00, period: "2026-Q1", source: "Cushman & Wakefield" },
      { propertyId: "PROP-102", metric: "vacancy_rate", value: 8.0, period: "2026-Q1", source: "JLL Research" },
      { propertyId: "PROP-102", metric: "cap_rate_trend", value: 5.8, period: "2026-Q1", source: "NCREIF" },
      { propertyId: "PROP-102", metric: "comp_sale", value: 221, period: "2025-Q4", source: "CoStar" },
      // PROP-103
      { propertyId: "PROP-103", metric: "comp_sale", value: 100, period: "2026-Q1", source: "CoStar" },
      { propertyId: "PROP-103", metric: "rental_rate", value: 8.20, period: "2026-Q1", source: "Colliers" },
      { propertyId: "PROP-103", metric: "vacancy_rate", value: 3.8, period: "2026-Q1", source: "JLL Research" },
      { propertyId: "PROP-103", metric: "cap_rate_trend", value: 7.1, period: "2026-Q1", source: "NCREIF" },
      { propertyId: "PROP-103", metric: "comp_sale", value: 95, period: "2025-Q4", source: "CoStar" },
      // PROP-104
      { propertyId: "PROP-104", metric: "comp_sale", value: 244, period: "2026-Q1", source: "CoStar" },
      { propertyId: "PROP-104", metric: "rental_rate", value: 42.00, period: "2026-Q1", source: "CBRE Market Report" },
      { propertyId: "PROP-104", metric: "vacancy_rate", value: 18.0, period: "2026-Q1", source: "JLL Research" },
      { propertyId: "PROP-104", metric: "cap_rate_trend", value: 5.4, period: "2026-Q1", source: "NCREIF" },
      { propertyId: "PROP-104", metric: "comp_sale", value: 238, period: "2025-Q4", source: "CoStar" },
      // PROP-105
      { propertyId: "PROP-105", metric: "comp_sale", value: 126, period: "2026-Q1", source: "CoStar" },
      { propertyId: "PROP-105", metric: "rental_rate", value: 24.00, period: "2026-Q1", source: "Newmark" },
      { propertyId: "PROP-105", metric: "vacancy_rate", value: 27.0, period: "2026-Q1", source: "JLL Research" },
      { propertyId: "PROP-105", metric: "cap_rate_trend", value: 7.5, period: "2026-Q1", source: "NCREIF" },
      { propertyId: "PROP-105", metric: "comp_sale", value: 132, period: "2025-Q4", source: "CoStar" },
      // PROP-106
      { propertyId: "PROP-106", metric: "comp_sale", value: 233, period: "2026-Q1", source: "CoStar" },
      { propertyId: "PROP-106", metric: "rental_rate", value: 35.00, period: "2026-Q1", source: "Cushman & Wakefield" },
      { propertyId: "PROP-106", metric: "vacancy_rate", value: 12.0, period: "2026-Q1", source: "JLL Research" },
      { propertyId: "PROP-106", metric: "cap_rate_trend", value: 6.0, period: "2026-Q1", source: "NCREIF" },
      { propertyId: "PROP-106", metric: "comp_sale", value: 228, period: "2025-Q4", source: "CoStar" },
      // PROP-107
      { propertyId: "PROP-107", metric: "comp_sale", value: 75, period: "2026-Q1", source: "CoStar" },
      { propertyId: "PROP-107", metric: "rental_rate", value: 6.50, period: "2026-Q1", source: "Colliers" },
      { propertyId: "PROP-107", metric: "vacancy_rate", value: 2.0, period: "2026-Q1", source: "JLL Research" },
      { propertyId: "PROP-107", metric: "cap_rate_trend", value: 7.8, period: "2026-Q1", source: "NCREIF" },
      { propertyId: "PROP-107", metric: "comp_sale", value: 72, period: "2025-Q4", source: "CoStar" },
      // PROP-108
      { propertyId: "PROP-108", metric: "comp_sale", value: 219, period: "2026-Q1", source: "CoStar" },
      { propertyId: "PROP-108", metric: "rental_rate", value: 30.00, period: "2026-Q1", source: "Newmark" },
      { propertyId: "PROP-108", metric: "vacancy_rate", value: 9.0, period: "2026-Q1", source: "JLL Research" },
      { propertyId: "PROP-108", metric: "cap_rate_trend", value: 6.3, period: "2026-Q1", source: "NCREIF" },
      { propertyId: "PROP-108", metric: "comp_sale", value: 215, period: "2025-Q4", source: "CoStar" },
    ];
    if (!hasMarketData) {
      for (const md of marketDataEntries) await ctx.db.insert("marketData", md);
    }

    // === MAINTENANCE ===
    const maintenanceItems = [
      { propertyId: "PROP-101", type: "inspection", title: "Annual fire suppression inspection", scheduledDate: "2026-04-25", status: "scheduled", contractor: "FirePro Systems", estimatedCost: 4500, notes: "All 6 floors plus garage levels" },
      { propertyId: "PROP-101", type: "repair", title: "Elevator car 2 motor replacement", scheduledDate: "2026-05-01", status: "scheduled", contractor: "KONE Elevators", estimatedCost: 85000 },
      { propertyId: "PROP-102", type: "repair", title: "Emergency roof membrane replacement", scheduledDate: "2026-04-18", status: "in_progress", contractor: "Northeast Roofing", estimatedCost: 380000, notes: "Priority due to water intrusion" },
      { propertyId: "PROP-103", type: "compliance", title: "Phase II environmental site assessment", scheduledDate: "2026-04-22", status: "scheduled", contractor: "EnviroTest Labs", estimatedCost: 28000 },
      { propertyId: "PROP-104", type: "inspection", title: "Annual boiler certification", scheduledDate: "2026-05-10", status: "scheduled", contractor: "CT Boiler Inspection", estimatedCost: 2200 },
      { propertyId: "PROP-104", type: "repair", title: "Kitchen exhaust ductwork modification", scheduledDate: "2026-04-20", status: "in_progress", contractor: "AirFlow Solutions", estimatedCost: 45000, notes: "Addressing tenant complaints" },
      { propertyId: "PROP-105", type: "repair", title: "Parking lot restriping and ADA updates", scheduledDate: "2026-05-15", status: "scheduled", contractor: "PaveMark Inc", estimatedCost: 12000 },
      { propertyId: "PROP-106", type: "compliance", title: "ADA accessibility remediation", scheduledDate: "2026-05-01", status: "scheduled", contractor: "AccessAbility Contractors", estimatedCost: 45000 },
      { propertyId: "PROP-107", type: "repair", title: "Fire suppression system full replacement", scheduledDate: "2026-06-01", status: "pending_approval", contractor: "FirePro Systems", estimatedCost: 340000 },
      { propertyId: "PROP-107", type: "inspection", title: "Structural beam inspection — loading dock", scheduledDate: "2026-04-28", status: "scheduled", contractor: "Structural Engineers LLC", estimatedCost: 8500 },
      { propertyId: "PROP-108", type: "repair", title: "HVAC system evaluation and replacement quote", scheduledDate: "2026-04-30", status: "scheduled", contractor: "Carrier HVAC Services", estimatedCost: 15000, notes: "Evaluation phase only" },
      { propertyId: "PROP-101", type: "compliance", title: "Asbestos re-inspection — floors 3-5", scheduledDate: "2026-05-20", status: "scheduled", contractor: "SafeAir Environmental", estimatedCost: 6000 },
      { propertyId: "PROP-102", type: "inspection", title: "Structural assessment post water damage", scheduledDate: "2026-04-19", status: "scheduled", contractor: "Structural Engineers LLC", estimatedCost: 12000 },
      { propertyId: "PROP-104", type: "compliance", title: "Energy audit and LEED certification review", scheduledDate: "2026-05-05", status: "scheduled", contractor: "GreenBuild Consulting", estimatedCost: 18000 },
      { propertyId: "PROP-106", type: "inspection", title: "Roof condition survey", scheduledDate: "2026-05-12", status: "scheduled", contractor: "Northeast Roofing", estimatedCost: 3500 },
    ];
    if (!hasMaintenance) {
      for (const m of maintenanceItems) await ctx.db.insert("maintenance", m);
    }

    // === REGULATIONS ===
    const regulations = [
      { regulationId: "REG-LEASE-001", category: "leasing", title: "Commercial Lease Renewal and Termination Standards", jurisdiction: "Connecticut", effectiveDate: "2025-01-01", content: "Commercial lease renewal procedures: (1) Landlord must provide written renewal offer at least 120 days before expiration for leases >5,000 sqft. (2) Early termination clauses require 180-day written notice and payment of unamortized TI costs. (3) Holdover tenancy converts to month-to-month at 150% of final contract rent. (4) Rent escalation caps at CPI + 3% unless otherwise negotiated. (5) Assignment and subletting require landlord consent which shall not be unreasonably withheld." },
      { regulationId: "REG-ENV-001", category: "environmental", title: "Environmental Site Assessment Requirements", jurisdiction: "Connecticut", effectiveDate: "2025-02-01", content: "Environmental due diligence requirements: (1) Phase I ESA required for all commercial property transactions per ASTM E1527-21. (2) If Phase I identifies RECs, Phase II assessment required before closing. (3) Underground storage tanks must be registered with CT DEEP. (4) Remediation plans require Licensed Environmental Professional (LEP) oversight. (5) Property Transfer Act (PA 22-5) requires disclosure of known contamination. (6) Cleanup standards: residential RSRs or industrial/commercial RSRs depending on property use." },
      { regulationId: "REG-ZONE-001", category: "zoning", title: "Commercial Zoning Classifications and Permitted Uses", jurisdiction: "Hartford, CT", effectiveDate: "2025-01-15", content: "Hartford zoning classifications: (1) B-2: General business, office, retail under 10,000 sqft. (2) B-3: Central business district, all commercial uses, no density limits. (3) C-1: Neighborhood retail, max 5,000 sqft per tenant. (4) C-2: Community retail, max 25,000 sqft per tenant. (5) M-1: Light industrial, warehousing, no heavy manufacturing. (6) M-2: General industrial, all manufacturing uses permitted. (7) MX-1: Mixed use, residential above commercial, FAR 8.0 max." },
      { regulationId: "REG-ZONE-002", category: "zoning", title: "Variance and Special Exception Procedures", jurisdiction: "Hartford, CT", effectiveDate: "2025-01-15", content: "Variance procedure: (1) Application to Planning and Zoning Commission at least 45 days before hearing. (2) Public notice in newspaper 15 days before hearing. (3) Abutting property owners notified by certified mail. (4) Applicant must demonstrate hardship, not self-created. (5) Commission decision within 65 days of hearing. (6) Appeal to Superior Court within 15 days of decision. (7) Special exceptions require site plan review and may include conditions of approval." },
      { regulationId: "REG-ADA-001", category: "ada_compliance", title: "ADA Accessibility Standards for Commercial Properties", jurisdiction: "Federal", effectiveDate: "2025-01-01", content: "ADA compliance for commercial properties: (1) Accessible route from parking to building entrance required. (2) Van-accessible spaces: 1 per 6 accessible spaces minimum. (3) Entrance doors min 32-inch clear width, max 8.5 lbs force. (4) Elevator required for buildings 3+ stories or 3,000+ sqft per floor. (5) Restrooms must meet current ADAAG specifications. (6) Tactile and Braille signage at permanent rooms and elevators. (7) Reasonable modifications to policies required upon tenant/visitor request." },
      { regulationId: "REG-FIRE-001", category: "fire_safety", title: "Fire Code Compliance for Commercial Buildings", jurisdiction: "Connecticut", effectiveDate: "2025-03-01", content: "Fire safety requirements: (1) Annual fire suppression system inspection required. (2) Sprinkler heads older than 50 years must be replaced or tested per NFPA 25. (3) Fire alarm systems must be monitored by UL-listed central station. (4) Emergency lighting and exit signage tested semi-annually. (5) Fire safety plans posted on each floor. (6) Cooking exhaust systems cleaned quarterly per NFPA 96. (7) Maximum occupant load posted and enforced." },
      { regulationId: "REG-MAINT-001", category: "maintenance", title: "Landlord Maintenance Obligations", jurisdiction: "Connecticut", effectiveDate: "2025-02-01", content: "Landlord maintenance obligations: (1) Roof, structural elements, and building envelope are landlord responsibility unless NNN lease. (2) Emergency repairs affecting habitability must commence within 24 hours. (3) HVAC common area systems maintained per manufacturer specifications. (4) Elevator maintenance contracts required for buildings with passenger elevators. (5) Parking lot maintenance including lighting, drainage, and surface condition. (6) CAM reconciliation provided to tenants within 120 days of fiscal year end." },
      { regulationId: "REG-TAX-001", category: "taxation", title: "Commercial Property Tax Assessment and Appeals", jurisdiction: "Connecticut", effectiveDate: "2025-01-01", content: "Property tax assessment: (1) Reassessment occurs every 5 years per CGS 12-62. (2) Market value determined by income approach, sales comparison, or cost approach. (3) Assessment ratio: 70% of fair market value. (4) Appeal to Board of Assessment Appeals within 20 days of assessment notice. (5) Further appeal to Superior Court within 2 months. (6) Tax abatement available for properties in Enterprise Zones or under PILOT agreements. (7) Supplemental assessments for new construction or major renovations." },
      { regulationId: "REG-ENERGY-001", category: "energy", title: "Building Energy Performance Disclosure", jurisdiction: "Connecticut", effectiveDate: "2025-06-01", content: "Energy benchmarking: (1) Commercial buildings >25,000 sqft must benchmark energy use via Energy Star Portfolio Manager. (2) Annual disclosure to CT DEEP by June 1 each year. (3) Energy audits required every 5 years for buildings scoring below 50. (4) Retro-commissioning required for buildings over 50,000 sqft. (5) New construction must meet current CT Building Code energy chapter. (6) LEED certification or equivalent may qualify for state incentives." },
      { regulationId: "REG-TENANT-001", category: "tenant_rights", title: "Commercial Tenant Protections", jurisdiction: "Connecticut", effectiveDate: "2025-01-15", content: "Tenant protections: (1) Security deposit limited to 2 months rent for leases under 5 years. (2) Landlord must return deposit within 30 days of lease termination. (3) Right of first refusal for adjacent space if included in lease. (4) Tenant improvements become property of landlord unless otherwise specified. (5) Landlord access requires 24-hour notice except in emergencies. (6) Non-disturbance agreement required if property is encumbered by mortgage." },
      { regulationId: "REG-INSUR-001", category: "insurance", title: "Commercial Property Insurance Requirements", jurisdiction: "Connecticut", effectiveDate: "2025-02-15", content: "Insurance requirements: (1) Property insurance: replacement cost coverage for building and common area improvements. (2) General liability: minimum $1M per occurrence, $2M aggregate. (3) Umbrella: minimum $5M for properties valued over $10M. (4) Environmental liability recommended for properties with known or suspected contamination. (5) Business interruption: minimum 12 months coverage. (6) Flood insurance required in FEMA-designated flood zones. (7) Certificates of insurance from all tenants required annually." },
      { regulationId: "REG-PARK-001", category: "parking", title: "Parking Requirements for Commercial Properties", jurisdiction: "Hartford, CT", effectiveDate: "2025-01-01", content: "Parking requirements: (1) Office: 4 spaces per 1,000 sqft. (2) Retail: 5 spaces per 1,000 sqft. (3) Industrial: 1 space per 1,500 sqft plus loading. (4) Restaurant: 1 space per 3 seats. (5) Shared parking reductions available for mixed-use with offset peak hours. (6) ADA accessible: per federal guidelines minimum. (7) Bicycle parking: 1 per 10,000 sqft minimum for new construction." },
      { regulationId: "REG-SIGN-001", category: "signage", title: "Commercial Signage Regulations", jurisdiction: "Hartford, CT", effectiveDate: "2025-03-15", content: "Signage regulations: (1) Ground signs limited to 6 feet height, 32 sqft area in B-2 zones. (2) Wall signs: max 10% of building facade area. (3) Illuminated signs require electrical permit. (4) Monument signs allowed in lieu of ground signs with site plan approval. (5) Temporary signs limited to 30 days, 2 per year per tenant. (6) All signs require sign permit before installation." },
      { regulationId: "REG-STORM-001", category: "environmental", title: "Stormwater Management Requirements", jurisdiction: "Connecticut", effectiveDate: "2025-04-01", content: "Stormwater management: (1) Properties with 1+ acre impervious surface require stormwater permit. (2) Post-development runoff must not exceed pre-development levels. (3) Low Impact Development (LID) practices preferred. (4) Annual inspection of retention/detention basins required. (5) Pollution prevention plan required for industrial properties. (6) MS4 permit compliance required for properties discharging to municipal systems." },
      { regulationId: "REG-ASBESTOS-001", category: "environmental", title: "Asbestos Management in Commercial Buildings", jurisdiction: "Connecticut", effectiveDate: "2025-01-01", content: "Asbestos requirements: (1) Building inspection required for all pre-1981 construction before renovation or demolition. (2) Management plan required for asbestos-containing materials (ACMs) that will remain in place. (3) Re-inspection every 3 years by certified inspector. (4) Notification to CT DEEP 10 working days before abatement. (5) Licensed abatement contractor required for removal of >10 linear feet or 25 sqft. (6) Air monitoring during and after abatement required." },
    ];
    if (!hasRegulations) {
      for (const r of regulations) await ctx.db.insert("regulations", r);
    }

    // === TRANSACTIONS (historical resolved cases) ===
    const transactions = [
      {
        transactionId: "TXN-001", propertyId: "PROP-101", listingId: "LST-001", type: "tenant_issue",
        resolution: "Successfully renegotiated anchor tenant retention through a combination of rent concession and capital improvement commitments. Offered 6-month rent abatement on 2 floors plus $1.2M lobby renovation. Tenant agreed to 5-year extension.",
        lessonsLearned: "Early engagement with tenant decision-makers is critical. Having a pre-built retention package ready before formal termination notice accelerates negotiation.",
        actionsTaken: ["Engaged tenant CEO directly within 48 hours", "Prepared competitive market analysis showing relocation costs", "Offered phased rent concession tied to extension term", "Committed to lobby and elevator modernization"],
        regulationIds: ["REG-LEASE-001"], resolvedAt: "2026-03-08T14:00:00Z",
      },
      {
        transactionId: "TXN-002", propertyId: "PROP-103", type: "inspection",
        resolution: "Environmental remediation completed under voluntary cleanup program. Soil removal and monitoring wells installed. CT DEEP issued letter of no further action. Total cost $285K, below initial estimate.",
        lessonsLearned: "Voluntary cleanup program provides more control over timeline and approach than enforcement action. Early engagement with LEP reduces overall cost.",
        actionsTaken: ["Engaged Licensed Environmental Professional immediately", "Enrolled in CT DEEP voluntary cleanup program", "Completed Phase II assessment within 30 days", "Removed contaminated soil and installed monitoring wells"],
        regulationIds: ["REG-ENV-001"], resolvedAt: "2026-02-17T18:30:00Z",
      },
      {
        transactionId: "TXN-003", propertyId: "PROP-106", type: "due_diligence",
        resolution: "Successfully appealed property tax assessment resulting in $2.1M reduction in assessed value. Used income capitalization approach with comparable rent rolls to demonstrate overvaluation. Annual tax savings: $42K.",
        lessonsLearned: "Income approach is most effective for appealing commercial assessments. Maintaining detailed rent roll records and market comp files strengthens appeal significantly.",
        actionsTaken: ["Retained tax appeal counsel within 10 days of assessment notice", "Compiled 3-year rent roll and expense history", "Identified 5 comparable sales supporting lower valuation", "Presented income approach analysis at BAA hearing"],
        regulationIds: ["REG-TAX-001"], resolvedAt: "2026-01-22T09:10:00Z",
      },
      {
        transactionId: "TXN-004", type: "lease_renewal",
        resolution: "Multi-tenant lease renewal negotiation completed across 3 retail tenants simultaneously. Achieved 8% average rent increase with staggered commencement dates to manage cash flow. All tenants signed 5-year renewals.",
        lessonsLearned: "Bundling multiple renewals creates leverage and reduces per-tenant negotiation cost. Offering tenant improvement allowance in lieu of rent reduction preserves base rent integrity.",
        actionsTaken: ["Prepared market rent analysis for each suite", "Offered TI allowance tied to lease term length", "Negotiated simultaneous signing with 30-day window", "Documented all terms in standardized LOI format"],
        regulationIds: ["REG-LEASE-001", "REG-TENANT-001"], resolvedAt: "2026-02-03T12:20:00Z",
      },
    ];
    if (!hasTransactions) {
      for (const t of transactions) await ctx.db.insert("transactions", t);
    }

    // === ACTION ITEMS ===
    const actionItems = [
      {
        actionItemId: "ACT-001", listingId: "LST-001", propertyId: "PROP-101", regionId: "Downtown",
        title: "Schedule meeting with Hartford Financial Group CFO", description: "Present retention package including rent concession and building improvement commitments before formal termination process begins.",
        assignee: "Maria Chen", priority: "high", status: "open", source: "seed", dueAt: "2026-04-18T18:00:00Z", createdAt: "2026-04-14T09:00:00Z",
      },
      {
        actionItemId: "ACT-002", listingId: "LST-003", propertyId: "PROP-103", regionId: "Downtown",
        title: "Engage LEP for Phase II environmental assessment", description: "Contract with Licensed Environmental Professional to conduct Phase II boring and lab analysis at Harbor Industrial Park loading dock area.",
        assignee: "Maria Chen", priority: "critical", status: "in_progress", source: "seed", dueAt: "2026-04-22T17:00:00Z", createdAt: "2026-04-14T06:50:00Z",
      },
      {
        actionItemId: "ACT-003", listingId: "LST-019", regionId: "Suburban",
        title: "Prepare suburban office repositioning strategy", description: "Analyze vacancy trends across suburban office portfolio and develop strategic plan addressing downtown flight pattern.",
        assignee: "Rachel Torres", priority: "high", status: "open", source: "seed", dueAt: "2026-04-25T17:00:00Z", createdAt: "2026-04-14T10:00:00Z",
      },
    ];
    if (!hasActionItems) {
      for (const item of actionItems) await ctx.db.insert("actionItems", item);
    }

    return `Seed checked: properties=${hasProperties ? "existing" : properties.length}, listings=${hasListings ? "existing" : listings.length}, marketData=${hasMarketData ? "existing" : marketDataEntries.length}, maintenance=${hasMaintenance ? "existing" : maintenanceItems.length}, regulations=${hasRegulations ? "existing" : regulations.length}, transactions=${hasTransactions ? "existing" : transactions.length}, actionItems=${hasActionItems ? "existing" : actionItems.length}`;
  },
});
