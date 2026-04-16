"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";

import { api } from "../../../convex/_generated/api";
import { ActionItemsPanel } from "@/components/ActionItemsPanel";
import { ChatPanel } from "@/components/ChatPanel";
import { PropertyListingCard } from "@/components/PropertyListingCard";
import { RecentActivityPanel } from "@/components/RecentActivityPanel";
import { useOperatorSession } from "@/components/OperatorSessionProvider";

const REGION_ID = "Downtown";
type PortfolioView = "overview" | "intervene" | "queue";

export default function PortfolioPage() {
  return (
    <Suspense fallback={<div className="app-shell"><div className="app-frame"><p className="py-6 text-center text-sm text-gray-400">Loading...</p></div></div>}>
      <PortfolioPageInner />
    </Suspense>
  );
}

function PortfolioPageInner() {
  const { operator } = useOperatorSession();
  const searchParams = useSearchParams();
  const operatorProfile = useQuery(
    api.users.getById,
    operator?.operatorId ? { operatorId: operator.operatorId } : "skip"
  );
  const hasRegionAccess =
    (operatorProfile?.role === "portfolio_manager" || operatorProfile?.role === "analyst") &&
    operatorProfile.regionIds.includes(REGION_ID);

  const [activeView, setActiveView] = useState<PortfolioView>("overview");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [delegatingListingId, setDelegatingListingId] = useState<string | null>(null);
  const [delegateNotes, setDelegateNotes] = useState("");

  useEffect(() => {
    const propParam = searchParams.get("property");
    if (propParam) setPropertyFilter(propParam);
  }, [searchParams]);

  const properties = useQuery(api.properties.getAll, hasRegionAccess && operator ? { operatorId: operator.operatorId } : "skip");
  const listings = useQuery(api.listings.getAll, hasRegionAccess && operator ? { operatorId: operator.operatorId } : "skip");
  const listingAttachments = useQuery(api.files.listByListingIds, hasRegionAccess && operator ? { operatorId: operator.operatorId, listingIds: listings?.map((l: any) => l.listingId) ?? [], regionId: REGION_ID } : "skip");
  const summary = useQuery(api.operations.getPortfolioOverview, hasRegionAccess && operator ? { operatorId: operator.operatorId, region: REGION_ID } : "skip");
  const portfolioActionItems = useQuery(api.actionItems.list, hasRegionAccess && operator ? { operatorId: operator.operatorId, regionId: REGION_ID } : "skip");
  const updateListingStatus = useMutation(api.listings.updateStatus);
  const escalateListing = useMutation(api.listings.escalate);

  const openListings = listings?.filter((l: any) => l.status !== "resolved") || [];
  const filteredListings = useMemo(() => {
    const base = listings ?? [];
    return base.filter((l: any) => {
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (severityFilter !== "all" && l.severity !== severityFilter) return false;
      if (propertyFilter !== "all") return l.propertyId === propertyFilter;
      return true;
    });
  }, [listings, severityFilter, statusFilter, propertyFilter]);

  const attachmentsByListing = (listingAttachments ?? []).reduce((acc: Record<string, any[]>, file: any) => {
    if (!file.listingId) return acc;
    acc[file.listingId] = [...(acc[file.listingId] ?? []), file];
    return acc;
  }, {});

  const criticalCount = openListings.filter((l: any) => l.severity === "critical").length;
  const escalatedCount = openListings.filter((l: any) => l.escalatedToPortfolio).length;
  const totalImpact = openListings.reduce((sum: number, l: any) => sum + l.revenueImpact, 0);

  const topInterventions = [...openListings]
    .sort((a: any, b: any) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return (order[a.severity as keyof typeof order] ?? 4) - (order[b.severity as keyof typeof order] ?? 4);
    })
    .slice(0, 3);

  const hotProperties = (properties ?? [])
    .map((prop: any) => {
      const propListings = openListings.filter((l: any) => l.propertyId === prop.propertyId);
      const criticals = propListings.filter((l: any) => l.severity === "critical").length;
      const impact = propListings.reduce((sum: number, l: any) => sum + l.revenueImpact, 0);
      return { ...prop, listingCount: propListings.length, criticals, impact };
    })
    .sort((a: any, b: any) => b.criticals - a.criticals || b.listingCount - a.listingCount || b.impact - a.impact)
    .slice(0, 4);

  const selectedListing = selectedListingId ? (listings ?? []).find((l: any) => l.listingId === selectedListingId) : null;
  const listingContext = useMemo(() => selectedListing ? { issueId: selectedListing.listingId, title: selectedListing.title, description: selectedListing.description } : undefined, [selectedListing?.listingId, selectedListing?.title, selectedListing?.description]);

  if (!operator) return <WorkspaceAccessState title="Portfolio command" message="Select a portfolio manager session from home before entering this workspace." />;
  if (operatorProfile === undefined) return <WorkspaceAccessState title="Portfolio command" message="Loading operator session..." />;
  if (!hasRegionAccess) return <WorkspaceAccessState title="Portfolio command" message="This workspace is only available to portfolio manager or analyst sessions." />;

  return (
    <div className="app-shell">
      <div className="app-frame flex flex-col gap-0">
        <header className="flex items-center justify-between border-b border-gray-200 pb-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">&larr;</Link>
            <h1 className="text-sm font-semibold text-gray-900">Portfolio Overview</h1>
            <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">{REGION_ID}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">{openListings.length} open</span>
            {criticalCount > 0 && <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">{criticalCount} critical</span>}
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">{escalatedCount} escalated</span>
            {summary && <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">{summary.avgOccupancy}% avg occ</span>}
            <span className="hidden text-xs text-gray-400 sm:inline">{operatorProfile.name}</span>
          </div>
        </header>

        <nav className="flex gap-4 border-b border-gray-200 pt-2">
          <TabButton active={activeView === "overview"} label="Overview" onClick={() => setActiveView("overview")} />
          <TabButton active={activeView === "intervene"} label="Intervene" onClick={() => setActiveView("intervene")} />
          <TabButton active={activeView === "queue"} label={`Queue (${escalatedCount})`} onClick={() => setActiveView("queue")} />
        </nav>

        <div className="mt-4 flex flex-col gap-5 xl:flex-row">
          <div className="min-w-0 flex-1 space-y-4">
            {activeView === "overview" && (
              <>
                <PatternAlertBanner listings={openListings} />

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <MetricBadge label="Open" value={summary?.openListingCount ?? openListings.length} />
                  <MetricBadge label="Critical" value={summary?.criticalListingCount ?? criticalCount} />
                  <MetricBadge label="Escalated" value={summary?.escalatedListingCount ?? escalatedCount} />
                  <MetricBadge label="At Risk" value={`$${((summary?.estimatedRevenueImpact ?? totalImpact) || 0).toLocaleString()}`} />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <button type="button" onClick={() => setPropertyFilter("all")} className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${propertyFilter === "all" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>All properties</button>
                  {(properties ?? []).map((p: any) => (
                    <button key={p.propertyId} type="button" onClick={() => setPropertyFilter(p.propertyId)} className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${propertyFilter === p.propertyId ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{p.propertyId}</button>
                  ))}
                </div>

                {hotProperties.length > 0 && (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {hotProperties.map((p: any) => (
                      <button key={p.propertyId} type="button" onClick={() => setPropertyFilter(p.propertyId)} className="rounded-lg border border-gray-200 bg-white p-3 text-left transition hover:border-gray-300">
                        <p className="text-sm font-medium text-gray-900">{p.name}</p>
                        <p className="text-[11px] text-gray-400">{p.type} / {Math.round(p.occupancyRate * 100)}% occ</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">{p.listingCount} open</span>
                          {p.criticals > 0 && <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] text-red-700">{p.criticals} crit</span>}
                          {p.impact > 0 && <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-700">${p.impact.toLocaleString()}</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 pb-2">
                    <select name="statusFilter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded border border-gray-200 bg-white px-2 py-1 text-xs outline-none">
                      <option value="all">All statuses</option><option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option>
                    </select>
                    <select name="severityFilter" value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className="rounded border border-gray-200 bg-white px-2 py-1 text-xs outline-none">
                      <option value="all">All severities</option><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
                    </select>
                    <span className="ml-auto text-xs text-gray-400">{filteredListings.length} shown</span>
                  </div>
                  {!listings ? (
                    <p className="py-6 text-center text-sm text-gray-400">Loading listings...</p>
                  ) : filteredListings.length === 0 ? (
                    <p className="py-6 text-center text-sm text-gray-400">No listings match current filters.</p>
                  ) : (
                    <div className="max-h-[600px] space-y-3 overflow-y-auto pr-1">
                      {[...filteredListings].sort((a: any, b: any) => { const order = { critical: 0, high: 1, medium: 2, low: 3 }; return (order[a.severity as keyof typeof order] ?? 4) - (order[b.severity as keyof typeof order] ?? 4); }).map((listing: any) => (
                        <PropertyListingCard key={listing._id} listing={listing} attachments={attachmentsByListing[listing.listingId] ?? []} showProperty onSelect={setSelectedListingId} isSelected={selectedListingId === listing.listingId} onResolve={(id) => updateListingStatus({ operatorId: operator.operatorId, listingId: id, status: "resolved", resolutionNotes: "Resolved from portfolio command." })} onEscalate={(id) => escalateListing({ operatorId: operator.operatorId, listingId: id })} />
                      ))}
                    </div>
                  )}
                </div>

                <ActionItemsPanel operatorId={operator.operatorId} title="Action items" regionId={REGION_ID} />
                <RecentActivityPanel operatorId={operator.operatorId} regionId={REGION_ID} title="Activity" />
              </>
            )}

            {activeView === "intervene" && (
              <>
                <div className="space-y-3">
                  {topInterventions.length === 0 ? (
                    <p className="py-6 text-center text-sm text-gray-400">No active cases requiring intervention.</p>
                  ) : topInterventions.map((listing: any) => (
                    <PropertyListingCard key={listing._id} listing={listing} attachments={attachmentsByListing[listing.listingId] ?? []} showProperty onSelect={setSelectedListingId} isSelected={selectedListingId === listing.listingId} onResolve={(id) => updateListingStatus({ operatorId: operator.operatorId, listingId: id, status: "resolved", resolutionNotes: "Resolved from portfolio command." })} onEscalate={(id) => escalateListing({ operatorId: operator.operatorId, listingId: id })} />
                  ))}
                </div>
                <ActionItemsPanel operatorId={operator.operatorId} title="Action items" regionId={REGION_ID} />
              </>
            )}

            {activeView === "queue" && (() => {
              const escalatedListings = (listings ?? []).filter((l: any) => l.escalatedToPortfolio && l.status !== "resolved").sort((a: any, b: any) => { const order = { critical: 0, high: 1, medium: 2, low: 3 }; return (order[a.severity as keyof typeof order] ?? 4) - (order[b.severity as keyof typeof order] ?? 4); });
              return (
                <>
                  <div>
                    <p className="pb-2 text-xs text-gray-400">{escalatedListings.length} escalated listing{escalatedListings.length !== 1 ? "s" : ""} awaiting review</p>
                    {escalatedListings.length === 0 ? (
                      <p className="py-6 text-center text-sm text-gray-400">No escalated listings in the queue.</p>
                    ) : (
                      <div className="max-h-[700px] space-y-3 overflow-y-auto pr-1">
                        {escalatedListings.map((listing: any) => (
                          <div key={listing._id} className="space-y-2">
                            <PropertyListingCard listing={listing} attachments={attachmentsByListing[listing.listingId] ?? []} showProperty onSelect={setSelectedListingId} isSelected={selectedListingId === listing.listingId} />
                            <div className="flex items-center gap-2 pl-2">
                              <button type="button" onClick={() => updateListingStatus({ operatorId: operator.operatorId, listingId: listing.listingId, status: "in_progress", resolutionNotes: "Accepted by portfolio manager." })} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-medium text-white transition hover:bg-indigo-700">Accept</button>
                              {delegatingListingId === listing.listingId ? (
                                <div className="flex items-center gap-2">
                                  <input type="text" value={delegateNotes} onChange={(e) => setDelegateNotes(e.target.value)} placeholder="Delegation notes..." className="rounded border border-gray-200 bg-white px-2 py-1.5 text-[11px] outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100" onClick={(e) => e.stopPropagation()} />
                                  <button type="button" onClick={() => { updateListingStatus({ operatorId: operator.operatorId, listingId: listing.listingId, status: "in_progress", resolutionNotes: `Delegated: ${delegateNotes || "Returned to broker for resolution."}` }); setDelegatingListingId(null); setDelegateNotes(""); }} className="rounded-lg bg-gray-800 px-3 py-1.5 text-[11px] font-medium text-white transition hover:bg-gray-900">Confirm</button>
                                  <button type="button" onClick={() => { setDelegatingListingId(null); setDelegateNotes(""); }} className="text-[11px] text-gray-400 hover:text-gray-600">Cancel</button>
                                </div>
                              ) : (
                                <button type="button" onClick={() => setDelegatingListingId(listing.listingId)} className="btn-secondary px-3 py-1.5 text-[11px]">Delegate</button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <ActionItemsPanel operatorId={operator.operatorId} title="Action items" regionId={REGION_ID} />
                  <RecentActivityPanel operatorId={operator.operatorId} regionId={REGION_ID} title="Activity" />
                </>
              );
            })()}
          </div>

          <div className="hidden w-[420px] shrink-0 xl:block">
            <ChatPanel operatorId={operator.operatorId} regionId={REGION_ID} issueContext={listingContext} onClearIssue={selectedListingId ? () => setSelectedListingId(null) : undefined} operatorName={operatorProfile?.name} />
          </div>
        </div>

        <div className="mt-4 xl:hidden">
          <ChatPanel operatorId={operator.operatorId} regionId={REGION_ID} />
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (<button type="button" onClick={onClick} className={`border-b-2 px-3 pb-2 text-sm font-medium transition ${active ? "border-indigo-600 text-gray-900" : "border-transparent text-gray-400 hover:text-gray-700"}`}>{label}</button>);
}

function MetricBadge({ label, value }: { label: string; value: number | string }) {
  return (<div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"><p className="text-[11px] font-medium uppercase text-gray-400">{label}</p><p className="mt-0.5 text-lg font-semibold text-gray-900">{value}</p></div>);
}

function PatternAlertBanner({ listings }: { listings: any[] }) {
  if (!listings || listings.length === 0) return null;
  const alerts: string[] = [];
  const typeByProperty: Record<string, Set<string>> = {};
  for (const l of listings) {
    if (!typeByProperty[l.type]) typeByProperty[l.type] = new Set();
    if (l.propertyId) typeByProperty[l.type].add(l.propertyId);
  }
  for (const [type, propSet] of Object.entries(typeByProperty)) {
    if (propSet.size >= 3) alerts.push(`${propSet.size} properties with ${type.replace(/_/g, " ")} items`);
  }
  if (alerts.length === 0) return null;
  return (
    <div className="space-y-2">
      {alerts.map((alert, i) => (
        <div key={i} className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          <span className="font-semibold">Pattern detected:</span> {alert}
        </div>
      ))}
    </div>
  );
}

function WorkspaceAccessState({ title, message }: { title: string; message: string }) {
  return (<div className="app-shell"><div className="app-frame"><div className="flex min-h-[300px] items-center justify-center"><div className="text-center"><Link href="/" className="text-sm text-gray-400 hover:text-gray-600">&larr; Home</Link><p className="mt-3 text-sm font-medium text-gray-900">{title}</p><p className="mt-1 text-sm text-gray-500">{message}</p></div></div></div></div>);
}
