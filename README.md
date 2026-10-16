# PropertyAI

## Developer handoff

PropertyAI is a prototype for commercial real estate brokers and portfolio managers. The tracked web app uses Next.js, React and Convex; its agent and evaluation actions call Gemini. Start with the source map and configuration boundaries below before running the demo or changing its agent.

This handoff describes source at `30fbda9a904859398d25d2644b00910e7497ed3e`. Installation, builds, provider access, model availability, browser behavior and evaluation quality were not verified. The original overview below describes synthetic demo content and intended behavior; its record counts and architecture statements are not measurements of a current deployment.

### Read the source

| Decision | Start here |
|---|---|
| Change the project safely | [AGENTS.md](AGENTS.md), [CLAUDE.md](CLAUDE.md) |
| Find the web entrypoints | [landing and operator selection](src/app/page.tsx), [property route](src/app/property/page.tsx), [portfolio route](src/app/portfolio/page.tsx), [chat route](src/app/chat/page.tsx) |
| Understand backend configuration | [root layout](src/app/layout.tsx), [Convex client provider](src/components/ConvexClientProvider.tsx) |
| Understand the demo session boundary | [operator session provider](src/components/OperatorSessionProvider.tsx), [backend access helpers](convex/access.ts) |
| Change data or agent behavior | [schema](convex/schema.ts), [agent action](convex/agent.ts) |
| Review scripts and evaluation wiring | [package manifest](package.json), [evaluation action](convex/eval.ts) |

When changing Convex code, follow the existing instruction to read [Convex guidelines](convex/_generated/ai/guidelines.md). The curated synthetic evaluation file is linked from AGENTS.md; its contents and quality were not assessed for this handoff.

### Configure the two sides

| Setting | Where the source reads it | Meaning |
|---|---|---|
| `NEXT_PUBLIC_CONVEX_URL` | Next.js client provider | URL of the intended Convex development deployment. The root layout wraps all routes with this provider; its missing-value branch renders a configuration notice instead of the app children. |
| `GEMINI_API_KEY` or `GOOGLE_API_KEY` | Convex agent and evaluation actions | Backend provider credential; the code prefers `GEMINI_API_KEY` and falls back to `GOOGLE_API_KEY`. Configure it in the Convex environment, not in a public frontend variable. |

Use a development Convex deployment you control. The existing local workflow is shown below; these commands were read from the repository and were not executed for this handoff:

```bash
npm install
# Terminal 1: configure/start the intended Convex development deployment
npx convex dev
# Terminal 2: point NEXT_PUBLIC_CONVEX_URL in .env.local at that deployment
npm run dev:app
```

The manifest also provides `npm run dev` to start Convex with Next.js, and `npm run build` for `next build`. A script's presence does not establish that it passes. No environment file or credential value was inspected.

`npm run seed` runs the backend seed command to populate demo data; run it only against the intended demo deployment. `npm run eval:live` invokes the backend evaluation action, which calls the agent and Gemini judge and writes evaluation records. Neither command is an offline documentation check, and neither was run here. No current accuracy result is claimed.

### Prototype boundaries

- The landing page selects an operator, and the browser session provider stores that selection in local storage. Backend access helpers look up the supplied operator ID and check property or region access. These demo mechanics do not establish authenticated user identity or production authorization.
- The agent source selects separate Pro and Flash-Lite preview model names for execution and planning. Those constants are source configuration, not proof that either model is currently available.
- [pyproject.toml](pyproject.toml) retains the retail-operations evaluation identity. The complete reviewed Git tree contains no `.py` implementation files; do not assume a runnable Python harness from that manifest alone.
- Synthetic demo records, reference checks and model-generated judge scores do not establish real property facts, regulatory correctness or production readiness.

Documentation history: [README handoff](CHANGELOG/docs/readme.md) · [agent-instruction link repair](CHANGELOG/docs/agents.md).

## Original project notes (preserved)

The following overview is retained from the reviewed source. Read it with the configuration and verification limits above.

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
