import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    operatorId: v.string(),
    name: v.string(),
    email: v.string(),
    role: v.string(),
    propertyIds: v.array(v.string()),
    regionIds: v.array(v.string()),
  }).index("by_operatorId", ["operatorId"])
    .index("by_role", ["role"]),

  properties: defineTable({
    propertyId: v.string(),
    name: v.string(),
    address: v.string(),
    type: v.string(),
    sqft: v.number(),
    yearBuilt: v.number(),
    marketValue: v.number(),
    occupancyRate: v.number(),
    capRate: v.number(),
    zoning: v.string(),
    region: v.string(),
    assignedBrokerId: v.string(),
  }).index("by_region", ["region"])
    .index("by_propertyId", ["propertyId"])
    .index("by_assignedBrokerId", ["assignedBrokerId"]),

  listings: defineTable({
    listingId: v.string(),
    propertyId: v.string(),
    type: v.string(),
    title: v.string(),
    description: v.string(),
    severity: v.string(),
    status: v.string(),
    revenueImpact: v.number(),
    createdAt: v.string(),
    resolvedAt: v.optional(v.string()),
    resolutionNotes: v.optional(v.string()),
    escalatedToPortfolio: v.boolean(),
    relatedRegulation: v.optional(v.string()),
    assignee: v.optional(v.string()),
    reportedByRole: v.string(),
    reporterName: v.string(),
  }).index("by_property", ["propertyId"])
    .index("by_status", ["status"])
    .index("by_severity", ["severity"])
    .index("by_type", ["type"])
    .index("by_listingId", ["listingId"]),

  marketData: defineTable({
    propertyId: v.string(),
    metric: v.string(),
    value: v.number(),
    period: v.string(),
    source: v.string(),
  }).index("by_property", ["propertyId"])
    .index("by_metric", ["metric"])
    .index("by_property_metric", ["propertyId", "metric"]),

  maintenance: defineTable({
    propertyId: v.string(),
    type: v.string(),
    title: v.string(),
    scheduledDate: v.string(),
    status: v.string(),
    contractor: v.string(),
    estimatedCost: v.number(),
    notes: v.optional(v.string()),
  }).index("by_property", ["propertyId"])
    .index("by_status", ["status"])
    .index("by_scheduledDate", ["scheduledDate"]),

  regulations: defineTable({
    regulationId: v.string(),
    category: v.string(),
    title: v.string(),
    content: v.string(),
    jurisdiction: v.string(),
    effectiveDate: v.string(),
  }).index("by_regulationId", ["regulationId"])
    .index("by_category", ["category"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["category"],
    }),

  transactions: defineTable({
    transactionId: v.string(),
    propertyId: v.optional(v.string()),
    listingId: v.optional(v.string()),
    type: v.string(),
    resolution: v.string(),
    lessonsLearned: v.string(),
    actionsTaken: v.array(v.string()),
    regulationIds: v.array(v.string()),
    resolvedAt: v.string(),
  }).index("by_type", ["type"])
    .index("by_propertyId", ["propertyId"])
    .searchIndex("search_resolution", {
      searchField: "resolution",
      filterFields: ["type"],
    }),

  actionItems: defineTable({
    actionItemId: v.string(),
    listingId: v.optional(v.string()),
    propertyId: v.optional(v.string()),
    regionId: v.optional(v.string()),
    title: v.string(),
    description: v.string(),
    assignee: v.string(),
    priority: v.string(),
    status: v.string(),
    source: v.string(),
    dueAt: v.optional(v.string()),
    createdAt: v.string(),
    completedAt: v.optional(v.string()),
  }).index("by_property", ["propertyId"])
    .index("by_region", ["regionId"])
    .index("by_status", ["status"])
    .index("by_priority", ["priority"])
    .index("by_listing", ["listingId"]),

  files: defineTable({
    fileId: v.string(),
    listingId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    propertyId: v.optional(v.string()),
    regionId: v.optional(v.string()),
    filename: v.string(),
    mimeType: v.string(),
    fileCategory: v.string(),
    sizeBytes: v.number(),
    storageId: v.optional(v.id("_storage")),
    uploadedBy: v.string(),
    uploadedAt: v.string(),
    analysisStatus: v.optional(v.string()),
    summary: v.optional(v.string()),
  }).index("by_listing", ["listingId"])
    .index("by_session", ["sessionId"])
    .index("by_property", ["propertyId"])
    .index("by_region", ["regionId"])
    .index("by_fileId", ["fileId"]),

  messages: defineTable({
    role: v.string(),
    content: v.string(),
    senderName: v.optional(v.string()),
    status: v.optional(v.string()),
    propertyId: v.optional(v.string()),
    regionId: v.optional(v.string()),
    sessionId: v.string(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    references: v.optional(v.array(v.string())),
    sourceUrls: v.optional(v.array(v.string())),
    fileIds: v.optional(v.array(v.string())),
    metadataJson: v.optional(v.string()),
  }).index("by_session", ["sessionId"]),

  messageEvents: defineTable({
    messageId: v.id("messages"),
    sessionId: v.string(),
    propertyId: v.optional(v.string()),
    regionId: v.optional(v.string()),
    eventType: v.string(),
    sequence: v.number(),
    summary: v.string(),
    payloadJson: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_session", ["sessionId"])
    .index("by_message", ["messageId"])
    .index("by_session_sequence", ["sessionId", "sequence"]),

  answerPackets: defineTable({
    answerPacketId: v.string(),
    messageId: v.optional(v.id("messages")),
    sessionId: v.string(),
    operatorId: v.string(),
    propertyId: v.optional(v.string()),
    regionId: v.optional(v.string()),
    query: v.string(),
    answer: v.string(),
    references: v.array(v.string()),
    sourceUrls: v.array(v.string()),
    qualityStatus: v.string(),
    qualitySummary: v.optional(v.string()),
    qualityChecksJson: v.string(),
    briefJson: v.optional(v.string()),
    traceJson: v.optional(v.string()),
    model: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_answerPacketId", ["answerPacketId"])
    .index("by_message", ["messageId"])
    .index("by_session", ["sessionId"])
    .index("by_session_createdAt", ["sessionId", "createdAt"])
    .index("by_property", ["propertyId"])
    .index("by_region", ["regionId"]),

  evalRuns: defineTable({
    evalRunId: v.string(),
    dataset: v.string(),
    model: v.string(),
    limit: v.number(),
    status: v.string(),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    summaryJson: v.optional(v.string()),
  }).index("by_evalRunId", ["evalRunId"])
    .index("by_status", ["status"])
    .index("by_startedAt", ["startedAt"]),

  evalCases: defineTable({
    evalRunId: v.string(),
    caseId: v.string(),
    scenario: v.string(),
    query: v.string(),
    responsePreview: v.string(),
    refScore: v.number(),
    foundRefs: v.array(v.string()),
    missingRefs: v.array(v.string()),
    criteriaResultsJson: v.string(),
    judgeScoresJson: v.string(),
    sessionId: v.optional(v.string()),
    messageId: v.optional(v.id("messages")),
    answerPacketId: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_evalRunId", ["evalRunId"])
    .index("by_evalRun_caseId", ["evalRunId", "caseId"]),

  eventLogs: defineTable({
    eventId: v.string(),
    eventType: v.string(),
    status: v.string(),
    actorId: v.string(),
    actorName: v.string(),
    actorRole: v.string(),
    propertyId: v.optional(v.string()),
    regionId: v.optional(v.string()),
    entityId: v.optional(v.string()),
    summary: v.string(),
    detailsJson: v.optional(v.string()),
    createdAt: v.string(),
  }).index("by_eventId", ["eventId"])
    .index("by_property", ["propertyId"])
    .index("by_region", ["regionId"])
    .index("by_actor", ["actorId"]),
});
