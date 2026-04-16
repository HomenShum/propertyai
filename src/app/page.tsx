"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useOperatorSession } from "@/components/OperatorSessionProvider";

const roleCards = [
  {
    href: "/property",
    role: "broker",
    eyebrow: "Property Mode",
    title: "Single-property due diligence and advisory",
    description:
      "Run due diligence, review tenant status, check market comps, inspect maintenance schedules, and get regulation-backed guidance for client meetings.",
    details: ["Due diligence", "Market comps", "Tenant analysis", "Maintenance tracking"],
  },
  {
    href: "/portfolio",
    role: "portfolio_manager",
    eyebrow: "Portfolio Mode",
    title: "Cross-property triage with risk context",
    description:
      "See where risk is clustering, compare property performance, manage lease expirations, and coordinate follow-up work across the portfolio.",
    details: ["Vacancy trends", "Lease expirations", "Risk scoring", "Portfolio analytics"],
  },
];

const proofPoints = [
  { label: "Properties in demo portfolio", value: "8" },
  { label: "Synthetic listings seeded", value: "20+" },
  { label: "Golden judge scenarios", value: "20" },
];

export default function Home() {
  const users = useQuery(api.users.listAvailable, {});
  const { operator, setOperator } = useOperatorSession();

  const grouped = {
    broker: (users ?? []).filter((user: any) => user.role === "broker"),
    portfolio_manager: (users ?? []).filter((user: any) => user.role === "portfolio_manager" || user.role === "analyst"),
  };

  return (
    <main className="app-shell">
      <div className="app-frame">
        <section className="glass-panel overflow-hidden">
          <div className="grid gap-10 px-6 py-8 sm:px-8 lg:grid-cols-[1.4fr_0.8fr] lg:px-12 lg:py-12">
            <div className="space-y-8">
              <div className="space-y-4">
                <p className="section-label">Real Estate Property Insight Layer</p>
                <div className="max-w-3xl space-y-4">
                  <h1 className="text-4xl font-semibold text-slate-900 sm:text-5xl lg:text-6xl">
                    Property intelligence that reads the market, the record, and the risk.
                  </h1>
                  <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                    This workspace is designed for commercial real estate brokers and portfolio
                    managers who need fast due diligence with receipts: current listings,
                    regulation references, market comps, and tracked follow-through.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {proofPoints.map((point) => (
                  <div key={point.label} className="metric-tile">
                    <p className="section-label">{point.label}</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{point.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-[20px] border border-[rgba(72,57,39,0.12)] bg-white/80 p-5">
                <p className="section-label">Operator Session</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Pick an operator identity before entering a workspace. The app enforces
                  property and portfolio access against this session.
                </p>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Property brokers
                    </p>
                    <div className="mt-2 space-y-2">
                      {grouped.broker.map((user: any) => (
                        <button
                          key={user.operatorId}
                          type="button"
                          onClick={() =>
                            setOperator({
                              operatorId: user.operatorId,
                              role: user.role,
                              name: user.name,
                            })
                          }
                          className={`w-full rounded-[18px] border px-4 py-3 text-left text-sm transition ${
                            operator?.operatorId === user.operatorId
                              ? "border-indigo-200 bg-indigo-50"
                              : "border-[rgba(72,57,39,0.12)] bg-white"
                          }`}
                        >
                          <p className="font-semibold text-slate-900">{user.name}</p>
                          <p className="text-xs text-slate-500">{user.propertyIds.join(", ")}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Portfolio operators
                    </p>
                    <div className="mt-2 space-y-2">
                      {grouped.portfolio_manager.map((user: any) => (
                        <button
                          key={user.operatorId}
                          type="button"
                          onClick={() =>
                            setOperator({
                              operatorId: user.operatorId,
                              role: user.role,
                              name: user.name,
                            })
                          }
                          className={`w-full rounded-[18px] border px-4 py-3 text-left text-sm transition ${
                            operator?.operatorId === user.operatorId
                              ? "border-indigo-200 bg-indigo-50"
                              : "border-[rgba(72,57,39,0.12)] bg-white"
                          }`}
                        >
                          <p className="font-semibold text-slate-900">{user.name}</p>
                          <p className="text-xs text-slate-500">{user.regionIds.join(", ")}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {operator ? (
                  <div className="mt-4 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Active session: <span className="font-semibold text-slate-900">{operator.name}</span>
                    {" / "}
                    {operator.role.replace("_", " ")}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="panel-strong relative overflow-hidden p-5 sm:p-6">
              <div className="relative space-y-5">
                <div>
                  <p className="section-label">Why This UI Exists</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                    Brokers need intelligence, not another chat toy.
                  </h2>
                </div>
                <div className="space-y-3 text-sm leading-6 text-slate-600">
                  <p>
                    They need a single place to see property risks, what regulations apply, what
                    market comps say, what maintenance is due, and who owns the next action.
                  </p>
                  <p>
                    The product below is organized around that assumption: evidence first, risk
                    surfaced early, and every recommendation tied back to something inspectable.
                  </p>
                </div>
                <div className="rounded-[18px] border border-slate-200 bg-white/90 p-4">
                  <p className="section-label">Shipped in this build</p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-700">
                    <li>Role-aware operator session and backend access checks</li>
                    <li>Property listing intake with document and image attachments</li>
                    <li>Gemini-backed grounded assistant with internal tool calls</li>
                    <li>Audit logging for agent, listing, file, and action events</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-2">
          {roleCards.map((card) => {
            const enabled = card.role === "broker"
              ? operator?.role === "broker"
              : operator?.role === "portfolio_manager" || operator?.role === "analyst";
            return (
              <div
                key={card.href}
                className={`glass-panel px-6 py-6 sm:px-7 ${enabled ? "" : "opacity-85"}`}
              >
                <p className="section-label">{card.eyebrow}</p>
                <h2 className="mt-3 text-2xl font-semibold text-slate-900">{card.title}</h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">{card.description}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {card.details.map((detail) => (
                    <span
                      key={detail}
                      className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs text-slate-600"
                    >
                      {detail}
                    </span>
                  ))}
                </div>
                <div className="mt-6">
                  {enabled ? (
                    <Link href={card.href} className="btn-primary inline-flex">
                      Enter workspace
                    </Link>
                  ) : (
                    <p className="text-sm font-medium text-gray-500">
                      Select a matching operator session to enter this workspace.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}
