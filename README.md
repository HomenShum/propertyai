# PropertyAI

Real estate property insight generator for commercial brokers and portfolio managers, built with Next.js, Convex, and Gemini.

## What it does

A commercial real estate broker wants a quick overview of a property before meeting a client. PropertyAI takes a property address or portfolio region, summarizes key property details, and highlights risks or talking points relevant for client discussions.

## Two personas

| Persona | Route | Focus |
|---------|-------|-------|
| **Property Broker** | `/property` | Single-property due diligence, market comps, tenant status, inspection history, regulation-backed guidance |
| **Portfolio Manager** | `/portfolio` | Multi-property risk, vacancy trends, lease expirations, maintenance costs, cross-property pattern detection |

## Architecture

```
Browser (Next.js 15 + React 19)
  |
  +-- Convex (real-time backend)
  |     |-- schema.ts        8 domain tables + 6 generic tables
  |     |-- seed.ts          8 properties, 20 listings, 40 market data points, 15 regulations
  |     |-- agent.ts         Plan-execute-synthesize orchestration with 10 tools
  |     |-- briefs.ts        Pre-query evidence assembly with relevance ranking
  |     |-- operations.ts    Property summary + portfolio overview aggregations
  |     |-- access.ts        RBAC: broker/portfolio_manager/analyst roles
  |     +-- eval.ts          Golden dataset evaluation with Gemini judge
  |
  +-- Gemini API (gemini-3.1-pro-preview)
        |-- Planning (flash-lite for step generation)
        |-- Execution (pro for tool calling + synthesis)
        +-- Google Search (grounded external facts)
```

## Key design decisions

1. **Convex brief before LLM** -- Before every agent run, `briefs.ts` pre-fetches and ranks listings, regulations, market data, maintenance, and transactions. The LLM receives structured evidence, not raw database dumps.

2. **Plan-execute-synthesize** -- A lightweight planner (flash-lite) generates 2-5 tool steps. The main model (pro) executes tools, then a synthesis pass produces the final answer. Fallback paths handle empty model responses.

3. **Quality checks at runtime** -- Every answer is evaluated against 7 checks: primary listing reference, governing regulation, action steps, revenue impact, cross-property patterns, priority ordering, and reference integrity. Results are stored in answer packets.

4. **Domain-specific tool declarations** -- 10 tools map to Convex queries/mutations: `search_listings`, `search_regulations`, `get_market_data`, `get_maintenance_schedule`, `get_property_summary`, `get_portfolio_overview`, `search_transactions`, `create_action_item`, `list_action_items`, `search_web`.

5. **Streaming with event trace** -- Every agent run emits structured `messageEvents` (plan.created, step.started, step.completed, synthesis.completed, quality.checked). The UI renders these as a live execution trace with telemetry.

## Data model

| Table | Purpose | Records |
|-------|---------|---------|
| `properties` | Physical assets with type, sqft, occupancy, cap rate, zoning | 8 |
| `listings` | Due diligence items, tenant issues, inspections, lease renewals, market alerts | 20 |
| `marketData` | Comp sales, rental rates, vacancy rates, cap rate trends per property | 40 |
| `maintenance` | Inspections, repairs, compliance items with schedules and costs | 15 |
| `regulations` | Zoning, ADA, environmental, fire, leasing, tax regulations | 15 |
| `transactions` | Historical resolved cases with lessons learned | 4 |
| `actionItems` | Tracked follow-ups with assignees, priorities, due dates | 3 |
| `users` | 2 brokers, 1 portfolio manager, 1 analyst | 4 |

## Running locally

```bash
npm install
npx convex dev          # starts Convex backend
npm run dev:app         # starts Next.js frontend
npm run seed            # seeds demo data
```

Set `GEMINI_API_KEY` in the Convex environment for the agent to work.

## Evaluation

```bash
npm run eval:live       # runs 20 golden scenarios through the agent
```

The eval harness calls `agent.chat` for each golden case, then:
- Checks required reference coverage (listing IDs, regulation IDs, property IDs)
- Validates structural criteria (action steps, cross-property patterns, revenue mentions)
- Runs a Gemini judge scoring accuracy, actionability, regulation compliance, completeness, and groundedness on a 1-5 scale

## Tradeoffs and constraints

- **No auth integration** -- Operator sessions are selected from a picker on the landing page. A production build would wire Clerk or Auth0.
- **Synthetic data only** -- All properties, listings, and market data are fabricated for demo purposes.
- **Single-region demo** -- The seed data covers Downtown and Suburban regions in Connecticut. The schema supports arbitrary regions.
- **No GraphRAG** -- Regulations are matched via full-text search. A production system would use a knowledge graph for regulation reasoning chains.
- **Gemini-only** -- The agent uses Gemini 3.1 Pro for all LLM calls. The architecture supports swapping models via the `MODEL_NAME` constant.

## Production roadmap

1. **GraphRAG for regulations** -- Neo4j or similar graph database for regulation dependency chains and cross-reference reasoning.
2. **Real market data integration** -- CoStar, CBRE, or JLL API feeds for live comp sales and vacancy data.
3. **Document intelligence** -- PDF extraction for leases, inspection reports, and environmental assessments.
4. **Multi-tenant auth** -- Clerk or WorkOS AuthKit with JWT-based Convex auth.
5. **Golden eval CI** -- Run the 20-scenario eval suite on every deploy and gate on quality regression.
