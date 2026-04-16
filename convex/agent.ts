import { v } from "convex/values";

import { api, internal } from "./_generated/api";
import { action } from "./_generated/server";

const MODEL_NAME = "gemini-3.1-pro-preview";
const PLANNER_MODEL_NAME = "gemini-3.1-flash-lite-preview";
const INLINE_ATTACHMENT_MAX_BYTES = 4 * 1024 * 1024;

function escapeForRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type ChatActionResult = {
  answer: string;
  trace: any;
  messageId: any;
  answerPacketId: string | null;
  quality: any;
};

const FUNCTION_DECLARATIONS = [
  {
    name: "search_listings",
    description:
      "Search for property listings (due diligence items, tenant issues, inspections, lease renewals, market alerts). Can filter by property, type, severity, status, or keyword. Use property_id='ALL' to search all properties.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        property_id: {
          type: "string",
          description: "Property ID (e.g., PROP-101). Use 'ALL' for all properties.",
        },
        type: {
          type: "string",
          description:
            "Filter: due_diligence, market_alert, tenant_issue, inspection, lease_renewal",
        },
        severity: {
          type: "string",
          description: "Filter: critical, high, medium, low",
        },
        status: {
          type: "string",
          description: "Filter: open, in_progress, resolved",
        },
        keyword: {
          type: "string",
          description: "Optional keyword such as tenant, lease, environmental, or LST-003.",
        },
      },
      required: ["property_id"],
    },
  },
  {
    name: "search_regulations",
    description:
      "Search real estate regulations by regulation ID or keyword. Returns regulatory references that should ground the recommendation.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        regulation_id: {
          type: "string",
          description: "Regulation ID (e.g., REG-LEASE-001)",
        },
        keyword: {
          type: "string",
          description: "Search keyword, such as lease, zoning, environmental, or ADA",
        },
      },
    },
  },
  {
    name: "get_market_data",
    description:
      "Look up market data for a property. Returns comp sales, rental rates, vacancy rates, and cap rate trends.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        property_id: {
          type: "string",
          description: "Property ID (e.g., PROP-101)",
        },
        metric: {
          type: "string",
          description: "Optional specific metric: comp_sale, rental_rate, vacancy_rate, cap_rate_trend",
        },
      },
      required: ["property_id"],
    },
  },
  {
    name: "get_maintenance_schedule",
    description:
      "Get maintenance schedule for a property. Returns upcoming inspections, repairs, and compliance items.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        property_id: {
          type: "string",
          description: "Property ID (e.g., PROP-101)",
        },
      },
      required: ["property_id"],
    },
  },
  {
    name: "get_property_summary",
    description:
      "Get property summary including open listings, vacancy risk, lease expirations, maintenance due, and revenue impact.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        property_id: {
          type: "string",
          description: "Property ID (e.g., PROP-101)",
        },
      },
      required: ["property_id"],
    },
  },
  {
    name: "get_portfolio_overview",
    description:
      "Get aggregate portfolio summary for a region including property count, critical listings, occupancy rates, revenue impact, and maintenance costs.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        region: {
          type: "string",
          description: "Region name (e.g., Downtown, Suburban)",
        },
      },
      required: ["region"],
    },
  },
  {
    name: "search_transactions",
    description:
      "Search historical resolved cases for similar property situations and what worked previously.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          description:
            "Optional type such as tenant_issue, inspection, lease_renewal, due_diligence, or market_alert",
        },
        query: {
          type: "string",
          description: "Free-text description of the current situation or desired precedent",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "create_action_item",
    description:
      "Create a tracked follow-up action item for a property or portfolio when the recommendation requires owner and due date.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        listing_id: { type: "string" },
        property_id: { type: "string" },
        region_id: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        assignee: { type: "string" },
        priority: {
          type: "string",
          description: "critical, high, medium, or low",
        },
        due_at: {
          type: "string",
          description: "ISO timestamp if the work is time-sensitive",
        },
      },
      required: ["title", "description", "assignee", "priority"],
    },
  },
  {
    name: "list_action_items",
    description:
      "List existing action items for a property or region to check current follow-up status.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        property_id: { type: "string" },
        region_id: { type: "string" },
      },
    },
  },
  {
    name: "search_web",
    description:
      "Search the web for current market data, regulatory updates, or external information relevant to the property question.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query",
        },
      },
      required: ["query"],
    },
  },
];

const TOOLS = [{ googleSearch: {} }, { functionDeclarations: FUNCTION_DECLARATIONS }];

function bytesToBase64(bytes: Uint8Array) {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let output = "";
  for (let index = 0; index < bytes.length; index += 3) {
    const a = bytes[index] ?? 0;
    const b = bytes[index + 1] ?? 0;
    const c = bytes[index + 2] ?? 0;
    const triple = (a << 16) | (b << 8) | c;
    output += alphabet[(triple >> 18) & 0x3f];
    output += alphabet[(triple >> 12) & 0x3f];
    output += index + 1 < bytes.length ? alphabet[(triple >> 6) & 0x3f] : "=";
    output += index + 2 < bytes.length ? alphabet[triple & 0x3f] : "=";
  }
  return output;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeJsonStringify(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return JSON.stringify({ error: "serialization_failed" });
  }
}

function extractUsageTelemetry(response: any) {
  const usage = response?.usageMetadata ?? {};
  return {
    tokensIn: usage.promptTokenCount ?? usage.inputTokenCount,
    tokensOut: usage.candidatesTokenCount ?? usage.outputTokenCount,
    totalTokens: usage.totalTokenCount,
  };
}

function extractGroundingUrls(response: any): string[] {
  const chunks = response?.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  const urls = chunks
    .map((chunk: any) => chunk?.web?.uri)
    .filter((value: string | undefined) => Boolean(value));
  return Array.from(new Set(urls));
}

function extractGroundingSources(response: any) {
  const chunks = response?.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  const deduped = new Map<string, any>();
  for (const chunk of chunks) {
    const url = chunk?.web?.uri;
    if (!url || deduped.has(url)) continue;
    let domain = url;
    try { domain = new URL(url).hostname.replace(/^www\./, ""); } catch { domain = url; }
    deduped.set(url, { rawUrl: url, url, domain, title: chunk?.web?.title, snippet: chunk?.retrievedContext });
  }
  return Array.from(deduped.values());
}

function extractTextParts(response: any, options?: { trim?: boolean; separator?: string }): string {
  const parts = response?.candidates?.[0]?.content?.parts ?? [];
  const text = parts.map((part: any) => (typeof part?.text === "string" ? part.text : "")).filter(Boolean).join(options?.separator ?? "\n");
  return options?.trim === false ? text : text.trim();
}

function extractAssistantText(response: any): string {
  return extractTextParts(response, { trim: true, separator: "\n" });
}

function extractFunctionCalls(response: any) {
  const parts = response?.candidates?.[0]?.content?.parts ?? [];
  return parts.map((part: any) => part?.functionCall).filter((call: any) => Boolean(call));
}

function appendReference(values: Set<string>, value: unknown) {
  if (typeof value === "string" && value.trim()) values.add(value.trim());
}

function humanizeSummaryKey(value: string) {
  return value.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatSummaryValue(key: string, value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") {
    if (/revenue|impact|cost|loss|risk|spend|value|rent/i.test(key)) return `$${value.toLocaleString()}`;
    return value.toLocaleString();
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") return value.length > 80 ? `${value.slice(0, 77)}...` : value;
  return null;
}

function summarizeResult(result: unknown): string {
  if (Array.isArray(result)) {
    if (result.length === 0) return "0 records returned";
    const sample = result.slice(0, 3).map((item: any) => item?.listingId || item?.regulationId || item?.transactionId || item?.actionItemId || item?.propertyId || item?.title).filter(Boolean).join(", ");
    return `${result.length} records returned${sample ? ` (${sample})` : ""}`;
  }
  if (!result) return "No result";
  if (typeof result === "string") return result.slice(0, 220);
  if (typeof result === "object") {
    const preview = ["listingId", "regulationId", "transactionId", "actionItemId", "propertyId", "title"].map((field) => (result as any)[field]).filter(Boolean).join(", ");
    if (preview) return preview;
    const scalarPreview = Object.entries(result as Record<string, unknown>).map(([key, value]) => { const formatted = formatSummaryValue(key, value); return formatted ? `${humanizeSummaryKey(key)}: ${formatted}` : null; }).filter(Boolean).slice(0, 4).join(" / ");
    if (scalarPreview) return scalarPreview;
    const keys = Object.keys(result as Record<string, unknown>);
    if (keys.length) return `Object result with ${keys.length} fields: ${keys.slice(0, 5).map(humanizeSummaryKey).join(", ")}`;
    return "Object result returned";
  }
  return String(result).slice(0, 220);
}

function deriveKeywordFromQuery(query: string) {
  const cleaned = query.replace(/[^\w\s-]/g, " ").split(/\s+/).filter((word) => word.length > 3).slice(0, 6).join(" ");
  return cleaned || query;
}

function shouldUseWebSearch(query: string) {
  return /\b(today|latest|recent|current|market|regulation|zoning|competitor|trend|rate|external|news|legal)\b/i.test(query);
}

function extractFirstJsonBlock(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1);
  return null;
}

function buildHistoryContents(messages: any[]) {
  const sorted = [...messages].sort((a, b) => a.createdAt - b.createdAt).slice(-10);
  return sorted.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.fileIds?.length > 0 ? `${message.content}\n\nAttached evidence: ${message.fileIds.join(", ")}` : message.content }],
  }));
}

function formatAttachmentSize(sizeBytes: number) {
  if (sizeBytes >= 1024 * 1024) return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
  if (sizeBytes >= 1024) return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
  return `${sizeBytes} B`;
}

function supportsInlineAttachment(file: any) {
  return Boolean(file.storageId) && file.sizeBytes <= INLINE_ATTACHMENT_MAX_BYTES && (file.mimeType.startsWith("image/") || file.mimeType === "application/pdf");
}

async function buildAttachmentContext(ctx: any, files: any[]) {
  const parts: any[] = [];
  const summaries: string[] = [];
  for (const file of files) {
    let summary = `- ${file.filename} (${file.fileCategory}, ${formatAttachmentSize(file.sizeBytes)})`;
    if (supportsInlineAttachment(file)) {
      const blob = await ctx.storage.get(file.storageId);
      if (blob) {
        const bytes = bytesToBase64(new Uint8Array(await blob.arrayBuffer()));
        parts.push({ inlineData: { data: bytes, mimeType: file.mimeType } });
        summary += " [included for model inspection]";
      }
    } else if (file.storageId && file.sizeBytes <= INLINE_ATTACHMENT_MAX_BYTES && (file.mimeType.startsWith("text/") || file.mimeType === "application/json")) {
      const blob = await ctx.storage.get(file.storageId);
      const text = blob ? (await blob.text()).slice(0, 12000) : "";
      if (text) { parts.push({ text: `Attachment ${file.filename} contents:\n${text}` }); summary += " [text extracted]"; }
    } else if (file.fileCategory === "video") {
      summary += " [video stored; not inlined]";
    }
    summaries.push(summary);
  }
  return { parts, summaries };
}

function formatListingLine(listing: any) {
  const extras = [listing.propertyId, listing.severity, listing.status, listing.relatedRegulation, typeof listing.revenueImpact === "number" && listing.revenueImpact > 0 ? `$${listing.revenueImpact.toLocaleString()}` : null].filter(Boolean);
  return `- ${listing.listingId}: ${listing.title}${extras.length ? ` (${extras.join(" / ")})` : ""}\n  ${listing.description}`;
}

function formatRegulationLine(regulation: any) {
  return `- ${regulation.regulationId}: ${regulation.title}\n  ${String(regulation.content ?? "").slice(0, 240)}`;
}

function formatMarketDataLine(item: any) {
  return `- ${item.propertyId} / ${item.metric}: ${item.value} (${item.period}, ${item.source})`;
}

function formatTransactionLine(txn: any) {
  return `- ${txn.transactionId}: ${txn.resolution.slice(0, 120)}\n  Lessons: ${txn.lessonsLearned.slice(0, 120)}`;
}

function formatBriefForPrompt(brief: any, query?: string) {
  const lowerQuery = String(query ?? "").toLowerCase();
  const primaryType = brief.matchedListings?.[0]?.type;
  const includeMarket = primaryType === "market_alert" || /\bmarket\b|\bcomp\b|\brate\b|\bvacancy\b|\brental\b|\bcap rate\b/.test(lowerQuery);
  const includeMaintenance = primaryType === "inspection" || /\bmaintenance\b|\binspection\b|\brepair\b|\bcompliance\b|\bfire\b/.test(lowerQuery);
  const includeTransactions = /\bbefore\b|\bresolved\b|\bwhat happened\b|\bwhat worked\b|\bprecedent\b|\bhistorical\b|\bpast\b/.test(lowerQuery);

  return `Scope summary:
- propertyId: ${brief.scope?.propertyId ?? "n/a"}
- regionId: ${brief.scope?.regionId ?? "n/a"}
- openListingCount: ${brief.scope?.openListingCount ?? 0}
- estimatedRevenueImpact: ${brief.scope?.estimatedRevenueImpact ?? 0}

Matched listings:
${brief.matchedListings?.length ? brief.matchedListings.slice(0, 3).map(formatListingLine).join("\n") : "- none"}

Cross-property related listings:
${brief.crossPropertyRelatedListings?.length ? brief.crossPropertyRelatedListings.slice(0, 3).map(formatListingLine).join("\n") : "- none"}

Regulations:
${brief.regulations?.length ? brief.regulations.slice(0, 3).map(formatRegulationLine).join("\n") : "- none"}

Market data highlights:
${includeMarket && brief.marketHighlights?.length ? brief.marketHighlights.slice(0, 3).map(formatMarketDataLine).join("\n") : "- omitted"}

Upcoming maintenance:
${includeMaintenance && brief.maintenanceItems?.length ? brief.maintenanceItems.slice(0, 3).map((m: any) => `- ${m.title} (${m.type}, ${m.scheduledDate}, $${m.estimatedCost.toLocaleString()}, ${m.status})`).join("\n") : "- omitted"}

Portfolio risk:
${brief.portfolioRisk?.length ? brief.portfolioRisk.map((p: any) => `- ${p.propertyId}: ${p.openListings} open, ${p.criticals} critical, $${p.impact.toLocaleString()} impact, ${Math.round(p.occupancyRate * 100)}% occupied`).join("\n") : "- omitted"}

Historical transactions:
${includeTransactions && brief.transactions?.length ? brief.transactions.map(formatTransactionLine).join("\n") : "- omitted"}`;
}

function collectBriefReferences(references: Set<string>, brief: any) {
  for (const listing of [...(brief.matchedListings ?? []), ...(brief.crossPropertyRelatedListings ?? [])]) {
    appendReference(references, listing.listingId);
    appendReference(references, listing.relatedRegulation);
    appendReference(references, listing.propertyId);
  }
  for (const reg of brief.regulations ?? []) appendReference(references, reg.regulationId);
  for (const item of brief.marketHighlights ?? []) appendReference(references, item.propertyId);
}

function extractTrackedReferences(text: string) {
  return Array.from(new Set((text.match(/\b(?:LST|REG|PROP|TXN|ACT)-[A-Z0-9-]+\b/gi) ?? []).map((v) => v.toUpperCase())));
}

function buildAllowedReferences(brief: any, references: Set<string>) {
  const allowed = new Set<string>();
  for (const ref of references) appendReference(allowed, ref);
  collectBriefReferences(allowed, brief);
  for (const txn of brief.transactions ?? []) { appendReference(allowed, txn.transactionId); appendReference(allowed, txn.propertyId); }
  for (const prop of brief.properties ?? []) appendReference(allowed, prop.propertyId);
  return allowed;
}

function buildQualityReport(answer: string, query: string, brief: any, references: Set<string>, sourceRefs: Map<string, any>) {
  const normalized = answer.toLowerCase();
  const primaryListing = brief.matchedListings?.[0];
  const primaryRegulation = brief.regulations?.find((r: any) => r.regulationId === primaryListing?.relatedRegulation) ?? brief.regulations?.[0] ?? (primaryListing?.relatedRegulation ? { regulationId: primaryListing.relatedRegulation } : null);
  const expectedCrossProperty = (brief.crossPropertyRelatedListings?.length ?? 0) > 0 || (!brief.scope?.propertyId && (brief.matchedListings?.length ?? 0) > 1);
  const expectedRevenue = typeof primaryListing?.revenueImpact === "number" ? primaryListing.revenueImpact > 0 : (brief.scope?.estimatedRevenueImpact ?? 0) > 0;
  const multiListingQuestion = !brief.scope?.propertyId || /\bsummary\b|\bfull picture\b|\bpattern\b|\btrend\b|\bcompare\b|\bwhich propert|\bintervention\b|\bportfolio\b/i.test(query);
  const answerRefs = extractTrackedReferences(answer);
  const answerProperties = new Set(answerRefs.filter((r) => r.startsWith("PROP-")));
  const allowedRefs = buildAllowedReferences(brief, references);
  const unsupportedRefs = answerRefs.filter((r) => !allowedRefs.has(r));
  const checks: Array<{ key: string; label: string; passed: boolean; severity: "error" | "warning"; message: string }> = [];
  const addCheck = (key: string, label: string, passed: boolean, message: string, severity: "error" | "warning") => { checks.push({ key, label, passed, message, severity }); };

  addCheck("primary_listing", "Tracked listing reference", !primaryListing || new RegExp(`\\b${escapeForRegex(String(primaryListing.listingId))}\\b`, "i").test(normalized), primaryListing ? new RegExp(`\\b${escapeForRegex(String(primaryListing.listingId))}\\b`, "i").test(normalized) ? `Final answer explicitly references ${primaryListing.listingId}.` : `Final answer is missing tracked listing ${primaryListing.listingId}.` : "No primary listing was required for this answer.", "error");
  addCheck("governing_regulation", "Governing regulation reference", !primaryRegulation || new RegExp(`\\b${escapeForRegex(String(primaryRegulation.regulationId))}\\b`, "i").test(normalized), primaryRegulation ? new RegExp(`\\b${escapeForRegex(String(primaryRegulation.regulationId))}\\b`, "i").test(normalized) ? `Final answer explicitly references ${primaryRegulation.regulationId}.` : `Final answer is missing governing regulation ${primaryRegulation.regulationId}.` : "No governing regulation was required for this answer.", "error");
  addCheck("action_steps", "Actionable next steps", /(?:^|\n)\s*(?:\d+\.|-)\s+\S/m.test(answer) || /\bnext steps?\b|\bimmediate actions?\b/i.test(answer), /(?:^|\n)\s*(?:\d+\.|-)\s+\S/m.test(answer) || /\bnext steps?\b|\bimmediate actions?\b/i.test(answer) ? "The answer includes explicit next-step structure." : "The answer needs clearer action sequencing for the broker.", multiListingQuestion ? "warning" : "error");
  addCheck("revenue_impact", "Commercial impact", !expectedRevenue || /\$\d|revenue impact|at risk|loss(es)?/i.test(answer), expectedRevenue ? /\$\d|revenue impact|at risk|loss(es)?/i.test(answer) ? "The answer quantifies business impact." : "Expected commercial impact is missing from the answer." : "No revenue-impact mention was required.", "warning");
  addCheck("cross_property_pattern", "Cross-property pattern", !expectedCrossProperty || /\bcross-propert|\bsystemic\b|\bmultiple propert|\bpattern\b|\bportfolio\b/i.test(answer) || answerProperties.size >= 2, expectedCrossProperty ? /\bcross-propert|\bsystemic\b|\bmultiple propert|\bpattern\b|\bportfolio\b/i.test(answer) || answerProperties.size >= 2 ? "The answer makes the broader pattern explicit." : "The answer should make the cross-property pattern more explicit." : "No broader cross-property pattern was required.", "warning");
  addCheck("priority_order", "Priority ordering", !multiListingQuestion || /(?:^|\n)\s*\d+\.\s/m.test(answer) || /\bpriority\b|\bfirst\b|\bsecond\b|\bstart with\b/i.test(answer), multiListingQuestion ? /(?:^|\n)\s*\d+\.\s/m.test(answer) || /\bpriority\b|\bfirst\b|\bsecond\b|\bstart with\b/i.test(answer) ? "The answer makes prioritization explicit." : "Portfolio or multi-listing answers should spell out priority order." : "Priority ordering is optional for this request.", "warning");
  addCheck("unsupported_refs", "Reference integrity", unsupportedRefs.length === 0, unsupportedRefs.length === 0 ? "All referenced IDs are backed by the current evidence packet." : `Unsupported IDs detected in the answer: ${unsupportedRefs.join(", ")}.`, "error");
  const externalFactsQuestion = shouldUseWebSearch(query);
  addCheck("external_source_backing", "External source backing", !externalFactsQuestion || sourceRefs.size > 0, externalFactsQuestion ? sourceRefs.size > 0 ? `External-current question is backed by ${sourceRefs.size} grounded source${sourceRefs.size === 1 ? "" : "s"}.` : "External-current question was answered without grounded external sources." : "No external grounding was required.", "warning");

  const failedErrors = checks.filter((c) => !c.passed && c.severity === "error").length;
  const failedWarnings = checks.filter((c) => !c.passed && c.severity === "warning").length;
  const status = failedErrors > 0 ? "fail" : failedWarnings > 0 ? "warning" : "pass";
  const summary = status === "pass" ? "All runtime quality checks passed." : status === "warning" ? `${failedWarnings} advisory quality check${failedWarnings === 1 ? "" : "s"} need attention.` : `${failedErrors} blocking quality check${failedErrors === 1 ? "" : "s"} failed.`;
  return { status, summary, checks, unsupportedRefs, referencedIds: answerRefs };
}

function normalizeContents(contents: any) {
  if (typeof contents === "string") return [{ role: "user", parts: [{ text: contents }] }];
  if (Array.isArray(contents)) return contents;
  return [{ role: "user", parts: [{ text: String(contents ?? "") }] }];
}

function buildGenerateContentPayload(request: any) {
  const config = request?.config ?? {};
  const payload: Record<string, any> = { contents: normalizeContents(request.contents) };
  if (config.systemInstruction) payload.systemInstruction = { parts: [{ text: config.systemInstruction }] };
  if (config.tools) payload.tools = config.tools;
  if (config.toolConfig) payload.toolConfig = config.toolConfig;
  const generationConfig: Record<string, any> = {};
  if (config.temperature !== undefined) generationConfig.temperature = config.temperature;
  if (config.responseMimeType) generationConfig.responseMimeType = config.responseMimeType;
  if (Object.keys(generationConfig).length > 0) payload.generationConfig = generationConfig;
  return payload;
}

async function generateContentWithRetry(apiKey: string, request: any, maxAttempts = 3) {
  let lastError: unknown;
  const model = encodeURIComponent(request.model);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const payload = buildGenerateContentPayload(request);
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error(await response.text());
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts) break;
      await sleep(400 * attempt);
    }
  }
  throw lastError;
}

async function runModelCall(apiKey: string, request: any) {
  const startedAt = Date.now();
  const response = await generateContentWithRetry(apiKey, request);
  return { response, durationMs: Date.now() - startedAt, telemetry: extractUsageTelemetry(response) };
}

function chunkTextForStreaming(text: string, maxChunkLength = 80) {
  const chunks: string[] = [];
  let cursor = 0;
  while (cursor < text.length) {
    let end = Math.min(text.length, cursor + maxChunkLength);
    if (end < text.length) { const bp = text.lastIndexOf(" ", end); if (bp > cursor + 20) end = bp + 1; }
    chunks.push(text.slice(cursor, end));
    cursor = end;
  }
  return chunks.filter(Boolean);
}

async function streamTextToDraft(text: string, onDelta: (delta: string, fullText: string) => Promise<void>) {
  const chunks = chunkTextForStreaming(text);
  let fullText = "";
  for (const chunk of chunks) { fullText += chunk; await onDelta(chunk, fullText); await sleep(18); }
  return { text: fullText };
}

function buildFallbackPlan(args: any) {
  const steps: any[] = [];
  if (args.propertyId) {
    steps.push({ id: "s1", stepIndex: 0, groupId: "discover", toolName: "get_property_summary", purpose: "Load property context and current risk levels.", args: { property_id: args.propertyId } });
  } else {
    steps.push({ id: "s1", stepIndex: 0, groupId: "discover", toolName: "get_portfolio_overview", purpose: "Load portfolio context and at-risk properties.", args: { region: args.regionId || "Downtown" } });
  }
  steps.push({ id: "s2", stepIndex: 0, groupId: "discover", toolName: "search_listings", purpose: "Find tracked listings relevant to the request.", args: { property_id: args.propertyId || "ALL", keyword: deriveKeywordFromQuery(args.query) } });
  steps.push({ id: "s3", stepIndex: 1, groupId: "ground", toolName: "search_regulations", purpose: "Find regulations that govern the recommendation.", args: { keyword: deriveKeywordFromQuery(args.query) }, dependsOn: ["s2"], injectPriorResults: ["s2"] });
  steps.push({ id: "s4", stepIndex: 1, groupId: "ground", toolName: "search_transactions", purpose: "Pull precedent from historical resolved cases.", args: { query: args.query }, dependsOn: ["s2"], injectPriorResults: ["s2"] });
  if (args.propertyId) {
    steps.push({ id: "s5", stepIndex: 1, groupId: "ground", toolName: "get_market_data", purpose: "Inspect market data when comps or rates may change the answer.", args: { property_id: args.propertyId }, dependsOn: ["s2"], injectPriorResults: ["s2"] });
  }
  if (shouldUseWebSearch(args.query)) {
    steps.push({ id: `s${steps.length + 1}`, stepIndex: 1, groupId: "external", toolName: "web_search", purpose: "Collect fresh external context when the question depends on current outside facts.", args: { query: args.query }, model: PLANNER_MODEL_NAME, dependsOn: ["s2"], injectPriorResults: ["s2"] });
  }
  steps.push({ id: `s${steps.length + 1}`, stepIndex: 2, groupId: "synthesize", toolName: "synthesize_report", purpose: "Combine all gathered evidence into a broker-ready answer.", args: {}, dependsOn: steps.map((s) => s.id), injectPriorResults: steps.map((s) => s.id), model: MODEL_NAME });
  return { summary: "Fallback plan created from scope, query intent, and known property data sources.", plan: steps, telemetry: { model: "fallback_planner", durationMs: 0 } };
}

async function buildHarnessPlan(apiKey: string, args: any, attachedFiles: any[], brief: any) {
  const attachmentSummary = attachedFiles.length > 0 ? attachedFiles.map((f) => `${f.filename} (${f.fileCategory}, ${formatAttachmentSize(f.sizeBytes)})`).join("; ") : "none";
  const prompt = `You are planning a real estate property insight agent run.

Return JSON only with this shape:
{
  "summary": "short sentence",
  "steps": [
    {
      "id": "s1",
      "stepIndex": 0,
      "groupId": "discover",
      "toolName": "search_listings",
      "args": { "property_id": "CURRENT", "keyword": "tenant lease termination" },
      "purpose": "Find the tracked listing."
    }
  ]
}

Rules:
- Available toolName values: web_search, search_listings, search_regulations, get_market_data, get_maintenance_schedule, search_transactions, get_property_summary, get_portfolio_overview, create_action_item, list_action_items
- Do not include synthesize_report; it is added automatically after execution.
- Use CURRENT for property_id or region when the current scope should be used.
- Prefer internal tools first.
- Use web_search only when current external facts would materially improve the answer.
- Only use create_action_item when the user is explicitly asking to create or track something.
- Keep the plan compact: 2 to 5 execution steps before synthesis.

Scope:
- propertyId: ${args.propertyId || "none"}
- regionId: ${args.regionId || "none"}
- query: ${args.query}
- attachments: ${attachmentSummary}

Structured Convex brief:
${formatBriefForPrompt(brief, args.query)}`;

  try {
    const { response, durationMs, telemetry } = await runModelCall(apiKey, { model: PLANNER_MODEL_NAME, contents: prompt, config: { temperature: 0.1, responseMimeType: "application/json" } });
    const rawText = extractAssistantText(response);
    const jsonBlock = extractFirstJsonBlock(rawText);
    if (!jsonBlock) return buildFallbackPlan(args);
    const parsed = JSON.parse(jsonBlock);
    const plan = Array.isArray(parsed?.steps) ? parsed.steps : [];
    if (plan.length === 0) return buildFallbackPlan(args);

    const normalized = plan.map((step: any, index: number) => ({
      id: typeof step?.id === "string" ? step.id : `s${index + 1}`,
      stepIndex: Number.isFinite(step?.stepIndex) ? step.stepIndex : 0,
      groupId: typeof step?.groupId === "string" ? step.groupId : "discover",
      toolName: step?.toolName,
      purpose: typeof step?.purpose === "string" && step.purpose.trim() ? step.purpose.trim() : `Run ${step?.toolName || "tool"}.`,
      args: {
        ...(step?.args ?? {}),
        property_id: step?.args?.property_id === "CURRENT" || step?.args?.property_id === "current" ? args.propertyId : step?.args?.property_id,
        region: step?.args?.region === "CURRENT" || step?.args?.region === "current" ? args.regionId || "Downtown" : step?.args?.region,
      },
      dependsOn: Array.isArray(step?.dependsOn) ? step.dependsOn.filter(Boolean) : undefined,
      injectPriorResults: Array.isArray(step?.injectPriorResults) ? step.injectPriorResults.filter(Boolean) : undefined,
      model: typeof step?.model === "string" ? step.model : undefined,
    })).filter((step: any) => typeof step.toolName === "string");

    if (!normalized.some((step: any) => step.toolName === "synthesize_report")) {
      normalized.push({ id: `s${normalized.length + 1}`, stepIndex: Math.max(...normalized.map((s: any) => s.stepIndex), 0) + 1, groupId: "synthesize", toolName: "synthesize_report", purpose: "Combine all gathered evidence into a broker-ready answer.", args: {}, dependsOn: normalized.map((s: any) => s.id), injectPriorResults: normalized.map((s: any) => s.id), model: MODEL_NAME });
    }
    return { summary: typeof parsed?.summary === "string" && parsed.summary.trim() ? parsed.summary.trim() : "Planner generated a compact harness run for this request.", plan: normalized, telemetry: { model: PLANNER_MODEL_NAME, durationMs, ...telemetry } };
  } catch {
    return buildFallbackPlan(args);
  }
}

async function generateFallbackAnswer(_ctx: any, args: any, apiKey: string, attachedFiles: any[], brief: any) {
  const prompt = `You are producing a grounded answer for a commercial real estate professional.

User query:
${args.query}

Context:
- Scope: ${args.propertyId ? `property ${args.propertyId}` : `portfolio region ${args.regionId || "Downtown"}`}
- Structured Convex brief:
${formatBriefForPrompt(brief, args.query)}
- Attached evidence: ${attachedFiles.length ? attachedFiles.map((f) => `${f.filename} (${f.fileCategory}, ${formatAttachmentSize(f.sizeBytes)})`).join("; ") : "none"}

Instructions:
- Answer with direct property advisory guidance.
- Reference exact listing IDs, regulation IDs, property IDs, dates, and revenue impact when present.
- Use numbered steps in 1. 2. 3. form whenever action is needed.
- If there is a cross-property pattern, say so explicitly.
- If the brief contains a primary tracked listing, lead with that listing ID first.
- If the brief contains regulation-backed actions, quote the concrete limits or thresholds from the regulation context when available.
- Only mention IDs, regulations, properties, timelines, and thresholds that appear in the structured brief.
- Do not mention historical transaction IDs unless the user explicitly asked for precedent or prior resolution history.
- Do not invent facts beyond the provided context.`;

  const { response, durationMs, telemetry } = await runModelCall(apiKey, { model: MODEL_NAME, contents: prompt, config: { temperature: 0.3 } });
  return { text: extractAssistantText(response), listings: brief.matchedListings ?? [], regulations: brief.regulations ?? [], transactions: brief.transactions ?? [], metrics: brief.scope ?? {}, telemetry: { model: MODEL_NAME, durationMs, ...telemetry } };
}

function makeRuntimeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`.toUpperCase();
}

export const chat = action({
  args: {
    operatorId: v.string(),
    query: v.string(),
    propertyId: v.optional(v.string()),
    regionId: v.optional(v.string()),
    sessionId: v.string(),
    senderName: v.optional(v.string()),
    fileIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args): Promise<ChatActionResult> => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error("Set GEMINI_API_KEY or GOOGLE_API_KEY in the Convex environment.");

    let draftMessageId: any = null;
    let eventSequence = 0;
    const references = new Set<string>();
    const sourceUrls = new Set<string>();
    const sourceRefs = new Map<string, any>();
    const toolTrace: Array<any> = [];
    const modelTurns: Array<any> = [];
    let plannerResult: any = { summary: "", telemetry: {}, plan: [] };
    let fallbackTelemetry: any = null;
    let qualityBrief: any = null;
    let qualityReport: any = null;
    let answerPacketId: string | null = null;

    const buildTracePayload = () => ({ planner: { summary: plannerResult.summary, telemetry: plannerResult.telemetry, plan: plannerResult.plan }, execution: { steps: toolTrace, modelTurns, totalDurationMs: toolTrace.reduce((s, st) => s + (st.durationMs ?? 0), 0) + modelTurns.reduce((s, t) => s + (t.durationMs ?? 0), 0), fallbackUsed: Boolean(fallbackTelemetry) }, sources: Array.from(sourceRefs.values()), telemetry: { planning: plannerResult.telemetry, modelTurns, fallback: fallbackTelemetry } });
    const buildMessageMetadata = () => ({ model: MODEL_NAME, operatorId: args.operatorId, answerPacketId, quality: qualityReport ? { status: qualityReport.status, summary: qualityReport.summary, checks: qualityReport.checks } : undefined, trace: buildTracePayload() });

    const syncDraft = async (options?: { content?: string; appendText?: string; status?: string }) => {
      if (!draftMessageId) return;
      await ctx.runMutation(api.messages.updateAssistantDraft, { messageId: draftMessageId, updatedAt: Date.now(), content: options?.content, appendText: options?.appendText, status: options?.status, references: Array.from(references), sourceUrls: Array.from(sourceUrls), metadataJson: safeJsonStringify(buildMessageMetadata()) });
    };

    const appendStreamEvent = async (eventType: string, summary: string, payload?: Record<string, unknown>) => {
      if (!draftMessageId) return;
      eventSequence += 1;
      await ctx.runMutation(api.messages.appendEvent, { messageId: draftMessageId, sessionId: args.sessionId, propertyId: args.propertyId, regionId: args.regionId, eventType, sequence: eventSequence, summary, payloadJson: payload ? safeJsonStringify(payload) : undefined, createdAt: Date.now() });
    };

    try {
      if (args.propertyId) {
        await ctx.runQuery(api.properties.getById, { operatorId: args.operatorId, propertyId: args.propertyId });
      } else if (args.regionId) {
        await ctx.runQuery(api.properties.getByRegion, { operatorId: args.operatorId, region: args.regionId });
      }

      const existingMessages = await ctx.runQuery(api.messages.getBySession, { operatorId: args.operatorId, sessionId: args.sessionId, propertyId: args.propertyId, regionId: args.regionId });
      const attachedFiles = args.fileIds && args.fileIds.length > 0 ? await ctx.runQuery(api.files.getByIds, { operatorId: args.operatorId, fileIds: args.fileIds, propertyId: args.propertyId, regionId: args.regionId }) : [];
      qualityBrief = await ctx.runQuery(api.briefs.getAgentBrief, { operatorId: args.operatorId, query: args.query, propertyId: args.propertyId, regionId: args.regionId });
      collectBriefReferences(references, qualityBrief);
      const userTimestamp = Date.now();

      await ctx.runMutation(api.messages.send, { role: "user", content: args.query, senderName: args.senderName, status: "completed", propertyId: args.propertyId, regionId: args.regionId, sessionId: args.sessionId, createdAt: userTimestamp, updatedAt: userTimestamp, fileIds: args.fileIds, metadataJson: JSON.stringify({ operatorId: args.operatorId }) });
      draftMessageId = await ctx.runMutation(api.messages.createDraftAssistant, { sessionId: args.sessionId, propertyId: args.propertyId, regionId: args.regionId, createdAt: Date.now(), metadataJson: safeJsonStringify({ model: MODEL_NAME, operatorId: args.operatorId, trace: buildTracePayload() }) });
      await appendStreamEvent("run.started", "Run started", { query: args.query });

      const systemPrompt = args.propertyId
        ? `You are a Property Insight Assistant for a commercial real estate brokerage. The user is the broker for property ${args.propertyId}. Prefer internal tools for property data, market comps, maintenance, and regulations. Use Google Search only when current external information materially improves the answer. Reference exact listing IDs, regulation IDs, property IDs, dates, and concrete next steps. Distinguish immediate actions from follow-up actions. Create action items when the answer clearly requires tracked execution. ALWAYS check search_transactions when handling a situation that has been resolved before or is similar to a past case. Proactively suggest what worked last time. When referencing contractor contacts, deadlines, or cost thresholds from regulations, format them prominently so the broker can act immediately.`
        : `You are a Portfolio Insight Assistant for a commercial real estate firm. The user is the portfolio manager for the ${args.regionId || "Downtown"} region. Prefer internal tools for property data, market comps, maintenance, and regulations. Use Google Search only when current external information materially improves the answer. Identify cross-property patterns, quantify risk, recommend immediate actions first, and create action items when multi-property follow-up is needed. ALWAYS check search_transactions when handling a situation that has been resolved before. Proactively suggest what worked last time. When referencing deadlines or thresholds from regulations, format them prominently so the portfolio manager can act immediately.`;

      plannerResult = await buildHarnessPlan(apiKey, args, attachedFiles, qualityBrief);
      await appendStreamEvent("plan.created", `Planned ${plannerResult.plan.length} steps`, { summary: plannerResult.summary, steps: plannerResult.plan });
      await syncDraft({ status: "streaming" });
      const historyContents = buildHistoryContents(existingMessages);
      const attachmentContext = await buildAttachmentContext(ctx, attachedFiles);
      const currentUserText = attachedFiles.length > 0 ? `${args.query}\n\nAttached evidence:\n${attachmentContext.summaries.join("\n")}\nUse attached evidence when it changes the recommendation.` : args.query;
      const contents: any[] = [...historyContents, { role: "user", parts: [{ text: currentUserText }, ...attachmentContext.parts] }];

      let assistantMessage = "";
      const plannedLookup = new Map<string, any>(plannerResult.plan.filter((s: any) => s.toolName !== "synthesize_report").map((s: any) => [s.toolName, s]));

      if (attachedFiles.length > 0) {
        toolTrace.push({ id: "attachments", stepIndex: -1, groupId: "input", tool: "attachments", purpose: "Attach uploaded evidence to the run context.", durationMs: 0, success: true, summary: attachmentContext.summaries.join(" | ").slice(0, 220), telemetry: {} });
        await appendStreamEvent("attachments.bound", `Bound ${attachedFiles.length} attachments`, { summaries: attachmentContext.summaries });
        await syncDraft();
      }

      for (let i = 0; i < 5; i++) {
        const { response, durationMs, telemetry } = await runModelCall(apiKey, { model: MODEL_NAME, contents, config: { systemInstruction: systemPrompt, tools: TOOLS, temperature: 0.4, toolConfig: { includeServerSideToolInvocations: true } } });
        modelTurns.push({ turn: i + 1, durationMs, model: MODEL_NAME, ...telemetry });
        await appendStreamEvent("model.turn.completed", `Completed reasoning turn ${i + 1}`, { turn: i + 1, durationMs, telemetry });

        assistantMessage = extractAssistantText(response);
        const groundedSources = extractGroundingSources(response);
        if (groundedSources.length) {
          for (const source of groundedSources) { sourceUrls.add(source.url); sourceRefs.set(source.url, source); }
          toolTrace.push({ id: `google-search-${i + 1}`, stepIndex: 1, groupId: "external", tool: "web_search", purpose: "Gathered externally grounded sources through Gemini Google Search.", durationMs, success: true, summary: `${groundedSources.length} grounded sources`, telemetry: { model: MODEL_NAME, ...telemetry }, sources: groundedSources });
          await appendStreamEvent("sources.updated", `Captured ${groundedSources.length} grounded sources`, { sources: groundedSources });
          await syncDraft();
        }

        const functionCalls = extractFunctionCalls(response);
        const candidateContent = response.candidates?.[0]?.content;
        if (functionCalls.length === 0) break;
        if (candidateContent) contents.push(candidateContent);

        const functionResponses = [];
        for (const call of functionCalls) {
          const toolName = call.name;
          const toolArgs = (call.args ?? {}) as Record<string, any>;
          let result: unknown;
          const toolStartedAt = Date.now();
          await appendStreamEvent("step.started", `Running ${toolName ?? "tool"}`, { toolName, args: toolArgs });

          try {
            switch (toolName) {
              case "search_listings":
                result = await ctx.runQuery(api.listings.search, { operatorId: args.operatorId, propertyId: toolArgs.property_id === "ALL" ? undefined : toolArgs.property_id, type: toolArgs.type, severity: toolArgs.severity, status: toolArgs.status, keyword: toolArgs.keyword });
                break;
              case "search_regulations":
                result = await ctx.runQuery(api.regulations.search, { regulationId: toolArgs.regulation_id, keyword: toolArgs.keyword });
                break;
              case "get_market_data":
                result = toolArgs.metric
                  ? await ctx.runQuery(api.marketData.getByPropertyAndMetric, { propertyId: toolArgs.property_id, metric: toolArgs.metric })
                  : await ctx.runQuery(api.marketData.getByProperty, { propertyId: toolArgs.property_id });
                break;
              case "get_maintenance_schedule":
                result = await ctx.runQuery(api.maintenance.getUpcoming, { operatorId: args.operatorId, propertyId: toolArgs.property_id });
                break;
              case "get_property_summary":
                result = await ctx.runQuery(api.operations.getPropertySummary, { operatorId: args.operatorId, propertyId: toolArgs.property_id });
                break;
              case "get_portfolio_overview":
                result = await ctx.runQuery(api.operations.getPortfolioOverview, { operatorId: args.operatorId, region: toolArgs.region });
                break;
              case "search_transactions":
                result = await ctx.runQuery(api.transactions.search, { type: toolArgs.type, query: toolArgs.query, limit: 5 });
                break;
              case "create_action_item":
                result = await ctx.runMutation(api.actionItems.create, { operatorId: args.operatorId, listingId: toolArgs.listing_id, propertyId: toolArgs.property_id, regionId: toolArgs.region_id, title: toolArgs.title, description: toolArgs.description, assignee: toolArgs.assignee, priority: toolArgs.priority, status: "open", source: "agent", dueAt: toolArgs.due_at });
                break;
              case "list_action_items":
                result = await ctx.runQuery(api.actionItems.list, { operatorId: args.operatorId, propertyId: toolArgs.property_id, regionId: toolArgs.region_id });
                break;
              default:
                result = { error: `Unknown tool: ${toolName}` };
            }
          } catch (error: any) {
            result = { error: error.message };
          }

          if (Array.isArray(result)) {
            for (const item of result) { appendReference(references, item.listingId); appendReference(references, item.relatedRegulation); appendReference(references, item.regulationId); appendReference(references, item.transactionId); appendReference(references, item.actionItemId); appendReference(references, item.propertyId); }
          } else if (result && typeof result === "object") {
            appendReference(references, (result as any).listingId); appendReference(references, (result as any).regulationId); appendReference(references, (result as any).transactionId); appendReference(references, (result as any).actionItemId); appendReference(references, (result as any).propertyId);
          }

          const plannedStep = plannedLookup.get(toolName ?? "");
          toolTrace.push({ id: call.id || `${toolName}-${i + 1}-${toolTrace.length + 1}`, stepIndex: plannedStep?.stepIndex ?? i, groupId: plannedStep?.groupId ?? "execute", tool: toolName ?? "unknown_tool", purpose: plannedStep?.purpose ?? `Run ${toolName ?? "tool"}.`, plannedArgs: plannedStep?.args, actualArgs: toolArgs, dependsOn: plannedStep?.dependsOn, injectPriorResults: plannedStep?.injectPriorResults, durationMs: Date.now() - toolStartedAt, success: !(result && typeof result === "object" && "error" in (result as any)), summary: summarizeResult(result), telemetry: {} });
          await appendStreamEvent("step.completed", `${toolName ?? "tool"} ${result && typeof result === "object" && "error" in (result as any) ? "failed" : "completed"}`, { step: toolTrace[toolTrace.length - 1] });
          await syncDraft();
          functionResponses.push({ functionResponse: { name: toolName, id: call.id, response: { output: result } } });
        }
        contents.push({ role: "user", parts: functionResponses });
      }

      let finalAnswer = "";
      if (!assistantMessage.trim()) {
        const fallback = await generateFallbackAnswer(ctx, args, apiKey, attachedFiles, qualityBrief);
        assistantMessage = fallback.text;
        finalAnswer = fallback.text;
        fallbackTelemetry = fallback.telemetry;
        for (const l of fallback.listings ?? []) { appendReference(references, l.listingId); appendReference(references, l.relatedRegulation); }
        for (const r of fallback.regulations ?? []) appendReference(references, r.regulationId);
        for (const t of fallback.transactions ?? []) appendReference(references, t.transactionId);
        toolTrace.push({ id: "fallback_synthesis", stepIndex: plannerResult.plan.length, groupId: "synthesize", tool: "fallback_synthesis", purpose: "Produce a final answer from internal data when the main generation path returns no text.", durationMs: fallback.telemetry?.durationMs ?? 0, success: true, summary: `listings=${fallback.listings.length}, regulations=${fallback.regulations.length}, transactions=${fallback.transactions.length}`, telemetry: fallback.telemetry });
        await appendStreamEvent("synthesis.completed", "Completed fallback synthesis", { telemetry: fallback.telemetry });
        await syncDraft({ content: finalAnswer, status: "completed" });
      } else {
        const synthesisPrompt = `${args.propertyId ? `You are finalizing a streaming answer for the broker of ${args.propertyId}.` : `You are finalizing a streaming answer for the portfolio manager of the ${args.regionId || "Downtown"} region.`}

Use the draft answer and execution evidence below to produce the final broker-ready response.
- Keep all claims grounded in the provided evidence.
- Prefer concise markdown with headings or bullets only when helpful.
- Mention internal references such as listing IDs, regulation IDs, and property IDs when relevant.
- If external sources were gathered, rely only on those source summaries for current external claims.
- Lead with the most relevant tracked listing or cross-property pattern when one exists in the Convex brief.
- Mention concrete revenue impact, dates, occupancy rates, cap rates, or market data when they exist in the brief.
- Only mention IDs, regulations, properties, and thresholds that appear in the Convex brief or execution evidence below.
- When action is required, format the immediate response as a numbered list using 1. 2. 3.
- Do not mention hidden system mechanics or internal metadata structures.

Original user request:
${args.query}

Planner summary:
${plannerResult.summary || "n/a"}

Structured Convex brief:
${formatBriefForPrompt(qualityBrief, args.query)}

Execution summary:
${toolTrace.map((s) => `- ${s.tool}: ${s.summary}${s.success === false ? " (failed)" : ""}`).join("\n")}

External sources:
${Array.from(sourceRefs.values()).map((s: any) => `- ${s.title || s.domain} (${s.domain})`).join("\n") || "- none"}

Draft answer to refine:
${assistantMessage}`;

        await appendStreamEvent("synthesis.started", "Streaming final answer", { seedLength: assistantMessage.length });
        await syncDraft({ content: "", status: "streaming" });

        const synthesis = await runModelCall(apiKey, { model: MODEL_NAME, contents: synthesisPrompt, config: { temperature: 0.3 } });
        modelTurns.push({ turn: modelTurns.length + 1, durationMs: synthesis.durationMs, model: MODEL_NAME, phase: "synthesis", ...synthesis.telemetry });
        finalAnswer = extractAssistantText(synthesis.response).trim() || assistantMessage;

        await streamTextToDraft(finalAnswer, async (delta) => { await ctx.runMutation(api.messages.updateAssistantDraft, { messageId: draftMessageId, appendText: delta, updatedAt: Date.now() }); });
        await appendStreamEvent("synthesis.completed", "Completed streamed synthesis", { durationMs: synthesis.durationMs, telemetry: synthesis.telemetry });
        await syncDraft({ content: finalAnswer, status: "completed" });
      }

      const tracePayload = buildTracePayload();
      qualityReport = buildQualityReport(finalAnswer, args.query, qualityBrief, references, sourceRefs);
      await appendStreamEvent("quality.checked", `Quality status: ${qualityReport.status}`, { quality: qualityReport });

      const answerPacket: { answerPacketId: string } = await ctx.runMutation(internal.answerPackets.create, { answerPacketId: makeRuntimeId("ANS"), messageId: draftMessageId, sessionId: args.sessionId, operatorId: args.operatorId, propertyId: args.propertyId, regionId: args.regionId, query: args.query, answer: finalAnswer, references: Array.from(references), sourceUrls: Array.from(sourceUrls), qualityStatus: qualityReport.status, qualitySummary: qualityReport.summary, qualityChecksJson: safeJsonStringify(qualityReport.checks), briefJson: safeJsonStringify(qualityBrief), traceJson: safeJsonStringify(tracePayload), model: MODEL_NAME, createdAt: Date.now() });
      answerPacketId = answerPacket.answerPacketId;

      await appendStreamEvent("answer.packet.created", `Stored ${answerPacketId}`, { answerPacketId, qualityStatus: qualityReport.status });
      await appendStreamEvent("run.completed", "Run completed", { planStepCount: plannerResult.plan.length, sourceUrlCount: sourceUrls.size, answerPacketId, qualityStatus: qualityReport.status });
      await syncDraft({ content: finalAnswer, status: "completed" });

      await ctx.runMutation(internal.audit.record, { actorId: args.operatorId, eventType: "agent.chat.completed", status: "success", propertyId: args.propertyId, regionId: args.regionId, entityId: args.sessionId, summary: `Completed assistant response for ${args.propertyId ?? args.regionId ?? "global"} scope.`, detailsJson: safeJsonStringify({ references: Array.from(references), sourceUrlCount: sourceUrls.size, planStepCount: plannerResult.plan.length, answerPacketId, qualityStatus: qualityReport.status, qualitySummary: qualityReport.summary, toolTrace }) });

      return { answer: finalAnswer, trace: tracePayload, messageId: draftMessageId, answerPacketId, quality: qualityReport };
    } catch (error: any) {
      if (draftMessageId) { await appendStreamEvent("run.failed", "Run failed", { message: error?.message ?? "Unknown agent failure" }); await syncDraft({ status: "failed" }); }
      await ctx.runMutation(internal.audit.record, { actorId: args.operatorId, eventType: "agent.chat.completed", status: "failure", propertyId: args.propertyId, regionId: args.regionId, entityId: args.sessionId, summary: `Assistant request failed for ${args.propertyId ?? args.regionId ?? "global"} scope.`, detailsJson: safeJsonStringify({ message: error?.message ?? "Unknown agent failure" }) });
      throw error;
    }
  },
});
