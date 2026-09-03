"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  MapPin, ChevronRight, CheckCircle, XCircle,
  Search, ChevronDown, ChevronUp, ExternalLink, Tag, RefreshCw, Database, Building2,
} from "lucide-react";

// ─── Partner Portal (Neon) types ───────────────────────────────────────────

type PortalVenue = {
  id: string;
  name: string;
  city: string;
  state: string;
  businessType: string | null;
  type: string | null;
  active: boolean;
  createdAt: string;
  owner: { email: string };
  _count: { incentives: number; events: number };
};

// ─── MySQL types ────────────────────────────────────────────────────────────

type Incentive = {
  id?: string;
  title: string;
  incentives?: string;
  description?: string;
  type?: string;
  category?: string;
  schedule?: string;
  incentive_hint?: string;
  start_date?: string;
  end_date?: string;
  group_friendly?: string | boolean;
};

type MySQLVenue = {
  mysqlId: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  businessType: string | null;
  experienceCategory: string | null;
  source: string | null;
  sourceEventId: string | null;
  incentiveSummary: string | null;
  website: string | null;
  dateUpdated: string | null;
  incentives: Incentive[];
};

type Pagination = { total: number; page: number; limit: number; pages: number };

// ─── Shared components ──────────────────────────────────────────────────────

function SourceBadge({ source }: { source: string | null }) {
  if (source === "partner_portal") {
    return (
      <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
        Partner Portal
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
      {source ?? "ConnectLive"}
    </span>
  );
}

// ─── Partner Portal tab ─────────────────────────────────────────────────────

function PortalVenuesTab() {
  const [venues, setVenues] = useState<PortalVenue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/portal-venues")
      .then((r) => r.json())
      .then((d) => setVenues(d.venues ?? []))
      .finally(() => setLoading(false));
  }, []);

  const activeCount = venues.filter((v) => v.active).length;

  return (
    <div>
      <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
        {venues.length} total · {activeCount} active
      </p>
      <div className="rounded-2xl border shadow-sm overflow-hidden" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)", background: "var(--bg)" }}>
              <th className="text-left px-6 py-3 font-medium">Venue</th>
              <th className="text-left px-6 py-3 font-medium">Owner</th>
              <th className="text-left px-6 py-3 font-medium">Type</th>
              <th className="text-center px-6 py-3 font-medium">Incentives</th>
              <th className="text-center px-6 py-3 font-medium">Status</th>
              <th className="text-right px-6 py-3 font-medium">Joined</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center" style={{ color: "var(--muted)" }}>Loading…</td></tr>
            ) : venues.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center" style={{ color: "var(--muted)" }}>No venues registered yet.</td></tr>
            ) : venues.map((v) => (
              <tr key={v.id} className="hover:bg-purple-50/20 transition-colors" style={{ borderBottom: "1px solid var(--border)" }}>
                <td className="px-6 py-3">
                  <p className="font-medium" style={{ color: "var(--fg)" }}>{v.name}</p>
                  <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: "var(--muted)" }}>
                    <MapPin className="w-3 h-3" />{v.city}, {v.state}
                  </p>
                </td>
                <td className="px-6 py-3 text-xs" style={{ color: "var(--muted)" }}>{v.owner.email}</td>
                <td className="px-6 py-3 text-xs" style={{ color: "var(--muted)" }}>{v.businessType ?? v.type ?? "—"}</td>
                <td className="px-6 py-3 text-center text-sm" style={{ color: "var(--fg)" }}>{v._count.incentives}</td>
                <td className="px-6 py-3 text-center">
                  {v.active ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3 h-3" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                      <XCircle className="w-3 h-3" /> Suspended
                    </span>
                  )}
                </td>
                <td className="px-6 py-3 text-right text-xs" style={{ color: "var(--muted)" }}>
                  {new Date(v.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/venues/${v.id}`} className="p-1.5 rounded-lg hover:bg-purple-100 transition-colors inline-flex">
                    <ChevronRight className="w-4 h-4 text-purple-600" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── All Venues (MySQL) tab ─────────────────────────────────────────────────

function IncentiveRow({ inc }: { inc: Incentive }) {
  const desc = inc.incentives ?? inc.description ?? "";
  const category = inc.type ?? inc.category ?? "";
  return (
    <div className="py-2 border-t first:border-t-0" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold" style={{ color: "var(--fg)" }}>{inc.title}</p>
          {desc && <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{desc}</p>}
          {inc.incentive_hint && (
            <p className="text-xs italic mt-0.5" style={{ color: "var(--muted)" }}>Hint: {inc.incentive_hint}</p>
          )}
          {inc.schedule && <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>⏱ {inc.schedule}</p>}
        </div>
        {category && (
          <span className="flex-shrink-0 text-xs px-1.5 py-0.5 rounded bg-purple-50 text-purple-700">{category}</span>
        )}
      </div>
      <div className="flex gap-3 mt-1 text-xs" style={{ color: "var(--muted)" }}>
        {inc.start_date && <span>From {new Date(inc.start_date).toLocaleDateString()}</span>}
        {inc.end_date && <span>Until {new Date(inc.end_date).toLocaleDateString()}</span>}
        {(inc.group_friendly === "Yes" || inc.group_friendly === true) && (
          <span className="text-emerald-600">Group friendly</span>
        )}
      </div>
    </div>
  );
}

function MySQLVenueRow({ venue }: { venue: MySQLVenue }) {
  const [open, setOpen] = useState(false);
  const hasIncentives = venue.incentives.length > 0;

  return (
    <>
      <tr
        className="hover:bg-purple-50/20 transition-colors"
        style={{ borderBottom: open ? "none" : "1px solid var(--border)", cursor: hasIncentives ? "pointer" : "default" }}
        onClick={() => hasIncentives && setOpen((o) => !o)}
      >
        <td className="px-4 py-3">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 w-4 flex-shrink-0 text-purple-500">
              {hasIncentives ? (open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />) : null}
            </span>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>{venue.name}</p>
              <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: "var(--muted)" }}>
                <MapPin className="w-3 h-3" />{venue.city}, {venue.state}
              </p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-xs" style={{ color: "var(--muted)" }}>
          {venue.businessType ?? venue.experienceCategory ?? "—"}
        </td>
        <td className="px-4 py-3"><SourceBadge source={venue.source} /></td>
        <td className="px-4 py-3 text-center">
          {hasIncentives ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
              <Tag className="w-3 h-3" />{venue.incentives.length}
            </span>
          ) : <span className="text-xs" style={{ color: "var(--muted)" }}>—</span>}
        </td>
        <td className="px-4 py-3 text-xs" style={{ color: "var(--muted)" }}>
          {venue.dateUpdated ? new Date(venue.dateUpdated).toLocaleDateString() : "—"}
        </td>
        <td className="px-4 py-3 text-right">
          {venue.website && (
            <a href={venue.website} target="_blank" rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex p-1.5 rounded-lg hover:bg-purple-100 transition-colors">
              <ExternalLink className="w-3.5 h-3.5 text-purple-600" />
            </a>
          )}
        </td>
      </tr>
      {open && hasIncentives && (
        <tr style={{ borderBottom: "1px solid var(--border)" }}>
          <td colSpan={6} className="px-4 pb-3 pt-0">
            <div className="ml-6 rounded-xl border p-3" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--muted)" }}>Incentives</p>
              {venue.incentives.map((inc, i) => <IncentiveRow key={inc.id ?? i} inc={inc} />)}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function AllVenuesTab() {
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("all");
  const [page, setPage] = useState(1);
  const [venues, setVenues] = useState<MySQLVenue[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchVenues = useCallback(async (s: string, src: string, p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search: s, source: src, page: String(p), limit: "25" });
      const res = await fetch(`/api/admin/mysql-venues?${params}`);
      const data = await res.json();
      setVenues(data.venues ?? []);
      setPagination(data.pagination ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setPage(1); fetchVenues(search, source, 1); }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search, source, fetchVenues]);

  useEffect(() => { fetchVenues(search, source, page); }, [page]); // eslint-disable-line

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--muted)" }} />
          <input type="text" placeholder="Search by name or city…" value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--fg)" }} />
        </div>
        <select value={source} onChange={(e) => { setSource(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--fg)" }}>
          <option value="all">All sources</option>
          <option value="partner_portal">Partner Portal only</option>
          <option value="connectlive">ConnectLive / unclaimed</option>
        </select>
        <button onClick={() => fetchVenues(search, source, page)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm hover:bg-purple-50 transition-colors"
          style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {pagination && (
        <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
          {pagination.total.toLocaleString()} total · showing {((page - 1) * 25) + 1}–{Math.min(page * 25, pagination.total)}
        </p>
      )}

      <div className="rounded-2xl border shadow-sm overflow-hidden" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)", background: "var(--bg)" }}>
              <th className="text-left px-4 py-3 font-medium">Venue</th>
              <th className="text-left px-4 py-3 font-medium">Type</th>
              <th className="text-left px-4 py-3 font-medium">Source</th>
              <th className="text-center px-4 py-3 font-medium">Incentives</th>
              <th className="text-left px-4 py-3 font-medium">Updated</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && venues.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center" style={{ color: "var(--muted)" }}>Loading…</td></tr>
            ) : venues.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center" style={{ color: "var(--muted)" }}>No venues found.</td></tr>
            ) : venues.map((v) => <MySQLVenueRow key={v.mysqlId} venue={v} />)}
          </tbody>
        </table>
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button disabled={page === 1 || loading} onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 rounded-xl border text-sm disabled:opacity-40 hover:bg-purple-50 transition-colors"
            style={{ borderColor: "var(--border)", color: "var(--fg)" }}>Previous</button>
          <span className="text-sm px-2" style={{ color: "var(--muted)" }}>Page {page} of {pagination.pages}</span>
          <button disabled={page === pagination.pages || loading} onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 rounded-xl border text-sm disabled:opacity-40 hover:bg-purple-50 transition-colors"
            style={{ borderColor: "var(--border)", color: "var(--fg)" }}>Next</button>
        </div>
      )}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function AdminVenuesPage() {
  const [tab, setTab] = useState<"portal" | "all">("portal");

  const tabs = [
    { key: "portal", label: "Partner Portal", icon: Building2 },
    { key: "all",    label: "All Venues",      icon: Database  },
  ] as const;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>Venues</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === key ? "bg-purple-600 text-white shadow-sm" : "hover:bg-purple-50/60"
            }`}
            style={tab === key ? {} : { color: "var(--muted)" }}>
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "portal" ? <PortalVenuesTab /> : <AllVenuesTab />}
    </div>
  );
}
