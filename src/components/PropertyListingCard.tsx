import { AttachmentList } from "./AttachmentList";

const severityStyles: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  high: "bg-amber-100 text-amber-800 border-amber-200",
  medium: "bg-sky-100 text-sky-800 border-sky-200",
  low: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const statusStyles: Record<string, string> = {
  open: "bg-slate-900 text-white border-slate-900",
  in_progress: "bg-teal-100 text-teal-800 border-teal-200",
  resolved: "bg-slate-100 text-slate-500 border-slate-200",
};

const typeStyles: Record<string, string> = {
  due_diligence: "text-indigo-700",
  market_alert: "text-amber-700",
  tenant_issue: "text-red-700",
  inspection: "text-sky-700",
  lease_renewal: "text-emerald-700",
};

interface PropertyListingCardProps {
  listing: {
    listingId: string;
    propertyId: string;
    title: string;
    description: string;
    severity: string;
    status: string;
    type: string;
    reporterName: string;
    revenueImpact: number;
    escalatedToPortfolio: boolean;
    createdAt: string;
  };
  attachments?: Array<{
    fileId: string;
    filename: string;
    mimeType: string;
    fileCategory: string;
    sizeBytes: number;
    url?: string | null;
  }>;
  showProperty?: boolean;
  onResolve?: (listingId: string) => void;
  onEscalate?: (listingId: string) => void;
  onSelect?: (listingId: string) => void;
  isSelected?: boolean;
}

const SLA_HOURS: Record<string, number> = {
  critical: 4,
  high: 24,
  medium: 72,
  low: 168,
};

function getSlaStatus(severity: string, createdAt: string, status: string): { label: string; color: string } | null {
  if (status === "resolved") return null;
  const slaHours = SLA_HOURS[severity];
  if (!slaHours) return null;
  const now = new Date();
  const created = new Date(createdAt);
  const elapsedMs = Math.max(0, now.getTime() - created.getTime());
  const elapsedHours = elapsedMs / (1000 * 60 * 60);
  if (elapsedHours >= slaHours) {
    const overdue = Math.round(elapsedHours - slaHours);
    return { label: `SLA: ${overdue}h overdue`, color: "bg-red-100 text-red-700 border-red-200" };
  }
  const remaining = slaHours - elapsedHours;
  const threshold = slaHours * 0.25;
  if (remaining <= threshold) {
    const remainingRound = Math.round(remaining);
    return { label: `SLA: ${remainingRound}h left`, color: "bg-amber-100 text-amber-700 border-amber-200" };
  }
  return null;
}

export function PropertyListingCard({
  listing,
  attachments = [],
  showProperty,
  onResolve,
  onEscalate,
  onSelect,
  isSelected,
}: PropertyListingCardProps) {
  const timeAgo = getTimeAgo(listing.createdAt);
  const sla = getSlaStatus(listing.severity, listing.createdAt, listing.status);

  return (
    <article
      onClick={onSelect ? () => onSelect(listing.listingId) : undefined}
      className={`panel-strong p-4 transition hover:-translate-y-0.5 hover:shadow-lg ${
        listing.status === "resolved" ? "opacity-75" : ""
      } ${listing.severity === "critical" ? "ring-1 ring-red-200" : ""} ${
        onSelect ? "cursor-pointer" : ""
      } ${isSelected ? "border-l-4 border-l-indigo-500 ring-1 ring-indigo-200" : ""}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-slate-600">
              {listing.listingId}
            </span>
            <span className={`rounded-full border border-slate-200 bg-white px-2.5 py-1 ${typeStyles[listing.type] || "text-slate-600"}`}>
              {listing.type.replace(/_/g, " ")}
            </span>
            {showProperty ? (
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-600">
                {listing.propertyId}
              </span>
            ) : null}
          </div>
          <div>
            <h3 className={`text-base font-semibold text-slate-900 ${onSelect ? "hover:text-indigo-600 transition-colors" : ""}`}>{listing.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{listing.description}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:max-w-[260px] sm:justify-end">
          {sla ? (
            <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${sla.color}`}>
              {sla.label}
            </span>
          ) : null}
          {listing.escalatedToPortfolio ? (
            <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
              escalated
            </span>
          ) : null}
          <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${severityStyles[listing.severity] || ""}`}>
            {listing.severity}
          </span>
          <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyles[listing.status] || ""}`}>
            {listing.status.replace("_", " ")}
          </span>
        </div>
      </div>

      <AttachmentList attachments={attachments} compact />

      <div className="mt-4 flex flex-col gap-3 border-t border-[rgba(72,57,39,0.08)] pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span>{listing.reporterName}</span>
          <span>/</span>
          <span>{timeAgo}</span>
          {listing.revenueImpact > 0 ? (
            <>
              <span>/</span>
              <span className="font-semibold text-red-700">
                ${listing.revenueImpact.toLocaleString()} at risk
              </span>
            </>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {listing.status !== "resolved" && onResolve ? (
            <button
              type="button"
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); onResolve(listing.listingId); }}
              className="btn-secondary px-3 py-1.5 text-[11px]"
            >
              Resolve
            </button>
          ) : null}
          {!listing.escalatedToPortfolio && onEscalate ? (
            <button
              type="button"
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); onEscalate(listing.listingId); }}
              className="rounded-2xl border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-medium text-red-700 transition hover:bg-red-100"
            >
              Escalate
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return "just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
