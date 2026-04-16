"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";

import { api } from "../../../convex/_generated/api";
import { ActionItemsPanel } from "@/components/ActionItemsPanel";
import { ChatPanel } from "@/components/ChatPanel";
import { PropertyListingCard } from "@/components/PropertyListingCard";
import { IssueComposer } from "@/components/IssueComposer";
import { RecentActivityPanel } from "@/components/RecentActivityPanel";
import { useOperatorSession } from "@/components/OperatorSessionProvider";

type PropertyView = "briefing" | "capture" | "records";

export default function PropertyPage() {
  return (
    <Suspense fallback={<div className="app-shell"><div className="app-frame"><p className="py-6 text-center text-sm text-gray-400">Loading...</p></div></div>}>
      <PropertyPageInner />
    </Suspense>
  );
}

function PropertyPageInner() {
  const { operator } = useOperatorSession();
  const searchParams = useSearchParams();
  const operatorProfile = useQuery(
    api.users.getById,
    operator?.operatorId ? { operatorId: operator.operatorId } : "skip"
  );
  const allowedProperties = operatorProfile?.propertyIds ?? [];
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [activeView, setActiveView] = useState<PropertyView>("briefing");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);

  useEffect(() => {
    if (!allowedProperties.length) { setSelectedProperty(""); return; }
    const propertyParam = searchParams.get("property");
    if (propertyParam && allowedProperties.includes(propertyParam)) { setSelectedProperty(propertyParam); return; }
    if (!selectedProperty || !allowedProperties.includes(selectedProperty)) setSelectedProperty(allowedProperties[0]);
  }, [allowedProperties, selectedProperty, searchParams]);

  const canAccess = operatorProfile?.role === "broker" && allowedProperties.length > 0 && !!selectedProperty;

  const listings = useQuery(api.listings.getByProperty, canAccess && operator ? { operatorId: operator.operatorId, propertyId: selectedProperty } : "skip");
  const listingAttachments = useQuery(api.files.listByListingIds, canAccess && operator ? { operatorId: operator.operatorId, listingIds: listings?.map((l: any) => l.listingId) ?? [], propertyId: selectedProperty } : "skip");
  const property = useQuery(api.properties.getById, canAccess && operator ? { operatorId: operator.operatorId, propertyId: selectedProperty } : "skip");
  const metrics = useQuery(api.operations.getPropertySummary, canAccess && operator ? { operatorId: operator.operatorId, propertyId: selectedProperty } : "skip");
  const actionItems = useQuery(api.actionItems.list, canAccess && operator ? { operatorId: operator.operatorId, propertyId: selectedProperty } : "skip");
  const updateListingStatus = useMutation(api.listings.updateStatus);
  const escalateListing = useMutation(api.listings.escalate);

  const openListings = useMemo(() => listings?.filter((l: any) => l.status !== "resolved") || [], [listings]);
  const filteredListings = useMemo(() => {
    const base = listings ?? [];
    return base.filter((l: any) => {
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (severityFilter !== "all" && l.severity !== severityFilter) return false;
      return true;
    });
  }, [listings, severityFilter, statusFilter]);
  const criticalCount = openListings.filter((l: any) => l.severity === "critical").length;
  const attachmentsByListing = (listingAttachments ?? []).reduce((acc: Record<string, any[]>, file: any) => {
    if (!file.listingId) return acc;
    acc[file.listingId] = [...(acc[file.listingId] ?? []), file];
    return acc;
  }, {});

  const topListing = [...openListings].sort((a: any, b: any) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return (order[a.severity as keyof typeof order] ?? 4) - (order[b.severity as keyof typeof order] ?? 4);
  })[0];

  const selectedListing = selectedListingId ? (listings ?? []).find((l: any) => l.listingId === selectedListingId) : null;
  const listingContext = useMemo(() => selectedListing ? { issueId: selectedListing.listingId, title: selectedListing.title, description: selectedListing.description } : undefined, [selectedListing?.listingId, selectedListing?.title, selectedListing?.description]);

  if (!operator) return <WorkspaceAccessState title="Property workspace" message="Select a broker session from home before entering this workspace." />;
  if (operatorProfile === undefined) return <WorkspaceAccessState title="Property workspace" message="Loading operator session..." />;
  if (operatorProfile?.role !== "broker") return <WorkspaceAccessState title="Property workspace" message="This workspace is only available to broker sessions." />;
  if (!selectedProperty) return <WorkspaceAccessState title="Property workspace" message="No property is assigned to this operator session." />;

  return (
    <div className="app-shell">
      <div className="app-frame flex flex-col gap-0">
        <header className="flex items-center justify-between border-b border-gray-200 pb-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">&larr;</Link>
            <h1 className="text-sm font-semibold text-gray-900">{property?.name ?? selectedProperty}</h1>
            <select name="propertySelector" value={selectedProperty} onChange={(e) => setSelectedProperty(e.target.value)} className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 outline-none">
              {allowedProperties.map((pid: string) => (<option key={pid} value={pid}>{pid}</option>))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            {property && <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">{property.type} / {property.sqft.toLocaleString()} sqft</span>}
            {property && <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">{Math.round(property.occupancyRate * 100)}% occ / {property.capRate}% cap</span>}
            {criticalCount > 0 && <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">{criticalCount} critical</span>}
            <span className="hidden text-xs text-gray-400 sm:inline">{operatorProfile.name}</span>
          </div>
        </header>

        <nav className="flex gap-4 border-b border-gray-200 pt-2">
          <TabButton active={activeView === "briefing"} label="Briefing" onClick={() => setActiveView("briefing")} />
          <TabButton active={activeView === "capture"} label="Capture" onClick={() => setActiveView("capture")} />
          <TabButton active={activeView === "records"} label="Records" onClick={() => setActiveView("records")} />
        </nav>

        <div className="mt-4 flex flex-col gap-5 xl:flex-row">
          <div className="min-w-0 flex-1 space-y-4">
            {activeView === "briefing" && (
              <>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <MetricBadge label="Open Items" value={metrics?.openListingCount ?? openListings.length} />
                  <MetricBadge label="Vacancy Risk" value={`${(metrics?.vacancyRisk ?? 0).toFixed(0)}%`} />
                  <MetricBadge label="Lease Exp." value={metrics?.leaseExpirationCount ?? 0} />
                  <MetricBadge label="Maint. Due" value={metrics?.maintenanceDueCount ?? 0} />
                </div>

                {topListing && (
                  <div className="panel-strong p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{topListing.title}</p>
                        <p className="mt-1 text-xs text-gray-500">{topListing.description}</p>
                      </div>
                      <div className="flex shrink-0 gap-1.5">
                        <span className="rounded bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">{topListing.severity}</span>
                        <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">{topListing.listingId}</span>
                      </div>
                    </div>
                  </div>
                )}

                <ListingList listings={filteredListings} allListings={listings} statusFilter={statusFilter} severityFilter={severityFilter} setStatusFilter={setStatusFilter} setSeverityFilter={setSeverityFilter} attachmentsByListing={attachmentsByListing} selectedListingId={selectedListingId} setSelectedListingId={setSelectedListingId} operatorId={operator.operatorId} updateListingStatus={updateListingStatus} escalateListing={escalateListing} />

                <ActionItemsPanel operatorId={operator.operatorId} title="Action items" propertyId={selectedProperty} />
                <RecentActivityPanel operatorId={operator.operatorId} propertyId={selectedProperty} title="Activity" />
              </>
            )}

            {activeView === "capture" && (
              <>
                <IssueComposer operatorId={operator.operatorId} propertyId={selectedProperty} regionId={property?.region || "Downtown"} reporterName={operatorProfile.name} reporterRole="broker" />
                <ActionItemsPanel operatorId={operator.operatorId} title="Action items" propertyId={selectedProperty} />
                <RecentActivityPanel operatorId={operator.operatorId} propertyId={selectedProperty} title="Activity" />
              </>
            )}

            {activeView === "records" && (
              <>
                <ListingList listings={filteredListings} allListings={listings} statusFilter={statusFilter} severityFilter={severityFilter} setStatusFilter={setStatusFilter} setSeverityFilter={setSeverityFilter} attachmentsByListing={attachmentsByListing} selectedListingId={selectedListingId} setSelectedListingId={setSelectedListingId} operatorId={operator.operatorId} updateListingStatus={updateListingStatus} escalateListing={escalateListing} />
                <ActionItemsPanel operatorId={operator.operatorId} title="Action items" propertyId={selectedProperty} />
                <RecentActivityPanel operatorId={operator.operatorId} propertyId={selectedProperty} title="Activity" />
              </>
            )}
          </div>

          <div className="hidden w-[400px] shrink-0 xl:block">
            <ChatPanel operatorId={operator.operatorId} propertyId={selectedProperty} issueContext={listingContext} onClearIssue={selectedListingId ? () => setSelectedListingId(null) : undefined} operatorName={operatorProfile?.name} />
          </div>
        </div>

        <div className="mt-4 xl:hidden">
          <ChatPanel operatorId={operator.operatorId} propertyId={selectedProperty} />
        </div>
      </div>
    </div>
  );
}

function ListingList({ listings, allListings, statusFilter, severityFilter, setStatusFilter, setSeverityFilter, attachmentsByListing, selectedListingId, setSelectedListingId, operatorId, updateListingStatus, escalateListing }: any) {
  return (
    <div>
      <div className="flex items-center gap-2 pb-2">
        <select name="statusFilter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded border border-gray-200 bg-white px-2 py-1 text-xs outline-none">
          <option value="all">All statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In progress</option>
          <option value="resolved">Resolved</option>
        </select>
        <select name="severityFilter" value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className="rounded border border-gray-200 bg-white px-2 py-1 text-xs outline-none">
          <option value="all">All severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <span className="ml-auto text-xs text-gray-400">{listings.length} shown</span>
      </div>
      {!allListings ? (
        <p className="py-6 text-center text-sm text-gray-400">Loading listings...</p>
      ) : listings.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">No listings match current filters.</p>
      ) : (
        <div className="max-h-[600px] space-y-3 overflow-y-auto pr-1">
          {[...listings].sort((a: any, b: any) => { const order = { critical: 0, high: 1, medium: 2, low: 3 }; return (order[a.severity as keyof typeof order] ?? 4) - (order[b.severity as keyof typeof order] ?? 4); }).map((listing: any) => (
            <PropertyListingCard key={listing._id} listing={listing} attachments={attachmentsByListing[listing.listingId] ?? []} onSelect={setSelectedListingId} isSelected={selectedListingId === listing.listingId} onResolve={(id: string) => updateListingStatus({ operatorId, listingId: id, status: "resolved", resolutionNotes: "Resolved from property workspace." })} onEscalate={(id: string) => escalateListing({ operatorId, listingId: id })} />
          ))}
        </div>
      )}
    </div>
  );
}

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (<button type="button" onClick={onClick} className={`border-b-2 px-3 pb-2 text-sm font-medium transition ${active ? "border-indigo-600 text-gray-900" : "border-transparent text-gray-400 hover:text-gray-700"}`}>{label}</button>);
}

function MetricBadge({ label, value }: { label: string; value: number | string }) {
  return (<div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"><p className="text-[11px] font-medium uppercase text-gray-400">{label}</p><p className="mt-0.5 text-lg font-semibold text-gray-900">{value}</p></div>);
}

function WorkspaceAccessState({ title, message }: { title: string; message: string }) {
  return (<div className="app-shell"><div className="app-frame"><div className="flex min-h-[300px] items-center justify-center"><div className="text-center"><Link href="/" className="text-sm text-gray-400 hover:text-gray-600">&larr; Home</Link><p className="mt-3 text-sm font-medium text-gray-900">{title}</p><p className="mt-1 text-sm text-gray-500">{message}</p></div></div></div></div>);
}
