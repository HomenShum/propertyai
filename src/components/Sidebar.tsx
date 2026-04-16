"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useOperatorSession } from "@/components/OperatorSessionProvider";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/property", label: "Property" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/chat", label: "Chat" },
];

const properties = [
  { id: "PROP-101", name: "One Financial" },
  { id: "PROP-102", name: "Riverside Retail" },
  { id: "PROP-103", name: "Harbor Industrial" },
  { id: "PROP-104", name: "Metro Mixed-Use" },
  { id: "PROP-105", name: "Westfield Office" },
  { id: "PROP-106", name: "College Town" },
  { id: "PROP-107", name: "Lakeside Warehouse" },
  { id: "PROP-108", name: "Elm St Professional" },
];

export function Sidebar() {
  return (
    <Suspense fallback={<SidebarFallback />}>
      <SidebarInner />
    </Suspense>
  );
}

function SidebarFallback() {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[220px] flex-col border-r border-gray-200 bg-white">
      <div className="px-4 py-4">
        <p className="text-[13px] font-bold text-gray-900">PropertyAI</p>
      </div>
    </aside>
  );
}

function SidebarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activePropertyParam = searchParams.get("property");
  const { operator } = useOperatorSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const operatorProfile = useQuery(
    api.users.getById,
    operator?.operatorId ? { operatorId: operator.operatorId } : "skip"
  );

  // Filter properties based on operator role
  const visibleProperties = (() => {
    if (!operator || !operatorProfile) return properties;
    if (operatorProfile.role === "broker") {
      const allowed = operatorProfile.propertyIds ?? [];
      return properties.filter((p) => allowed.includes(p.id));
    }
    // portfolio_manager and analyst see all
    return properties;
  })();

  const hasAccess = !!operator;

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-3 top-3 z-50 rounded-md border border-gray-200 bg-white p-2 shadow-sm md:hidden"
        aria-label="Open menu"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M3 5h14M3 10h14M3 15h14" />
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`fixed left-0 top-0 z-40 flex h-screen w-[220px] flex-col border-r border-gray-200 bg-white transition-transform duration-200 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0`}>
        <div className="flex items-center justify-between px-4 py-4">
          <p className="text-[13px] font-bold text-gray-900">PropertyAI</p>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded p-1 text-gray-400 hover:text-gray-600 md:hidden"
            aria-label="Close menu"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 px-2">
          <div className="space-y-0.5">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block rounded-md px-3 py-1.5 text-[13px] font-medium transition ${
                    isActive
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="mt-6">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Properties
            </p>
            <div className="mt-2 space-y-0.5">
              {visibleProperties.map((prop) => {
                const isActiveProperty = activePropertyParam === prop.id;
                const targetPath = pathname.startsWith("/portfolio")
                  ? `/portfolio?property=${prop.id}`
                  : `/property?property=${prop.id}`;
                return hasAccess ? (
                  <Link
                    key={prop.id}
                    href={targetPath}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-between rounded-md px-3 py-1 text-[13px] transition ${
                      isActiveProperty
                        ? "bg-indigo-50 text-indigo-600 font-medium"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <span>{prop.name}</span>
                    <span className={`text-[11px] ${isActiveProperty ? "text-indigo-400" : "text-gray-400"}`}>{prop.id}</span>
                  </Link>
                ) : (
                  <div
                    key={prop.id}
                    className="flex items-center justify-between rounded-md px-3 py-1 text-[13px] text-gray-300 cursor-not-allowed"
                  >
                    <span>{prop.name}</span>
                    <span className="text-[11px] text-gray-300">{prop.id}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </nav>

        {operator ? (
          <div className="border-t border-gray-200 px-4 py-3">
            <p className="truncate text-[13px] font-medium text-gray-900">
              {operator.name}
            </p>
            <p className="text-[11px] text-gray-400">
              {operator.role.replace("_", " ")}
            </p>
          </div>
        ) : (
          <div className="border-t border-gray-200 px-4 py-3">
            <p className="text-[13px] text-gray-400">No session</p>
          </div>
        )}
      </aside>
    </>
  );
}
