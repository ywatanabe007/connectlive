"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MapPin, Search, ChevronDown, ChevronUp, ExternalLink, Tag, RefreshCw } from "lucide-react";

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

type Venue = {
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
  incentiveCategory: string | null;
  incentiveSummary: string | null;
  incentiveHint: string | null;
  imageUrl: string | null;
  website: string | null;
  description: string | null;
  groupFriendly: boolean;
  dateUpdated: string | null;
  incentives: Incentive[];
};

type Pagination = { total: number; page: number; limit: number; pages: number };

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
          {inc.schedule && (
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>⏱ {inc.schedule}</p>
          )}
        </div>
        {category && (
          <span className="flex-shrink-0 text-xs px-1.5 py-0.5 rounded bg-purple-50 text-purple-700">{category}</span>
        )}
      </div>
      <div className="flex gap-3 mt-1 text-xs" style={{ color: "var(--muted)" }}>
        {inc.start_date && <span>From {new Date(inc.start_date).toLocaleDateString()}</span>}
        {inc.end_date && <span>Until {new Date(inc.end_date).toLocaleDateString()}</span>}
        {inc.group_friendly === "Yes" || inc.group_friendly === true ? (
          <span className="text-emerald-600">Group friendly</span>
        ) : null}
      </div>
    </div>
  );
}

function VenueRow({ venue }: { venue: Venue }) {
  const [open, setOpen] = useState(false);
  const hasIncentives = venue.incentives.length > 0;

  return (
    <>
      <tr
        className="hover:bg-purple-50/20 transition-colors cursor-pointer"
        style={{ borderBottom: open ? "none" : "1px solid var(--border)" }}
        onClick={() => hasIncentives && setOpen((o) => !o)}
      >
        <td className="px-4 py-3">
          <div className="flex items-start gap-2">
            {hasIncentives && (
              <button className="mt-0.5 flex-shrink-0 text-purple-500">
                {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}
            {!hasIncentives && <span className="w-4 flex-shrink-0" />}
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
        <td className="px-4 py-3">
          <SourceBadge source={venue.source} />
        </td>
        <td className="px-4 py-3 text-center">
          {hasIncentives ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
              <Tag className="w-3 h-3" />{venue.incentives.length}
            </span>
          ) : (
            <span className="text-xs" style={{ color: "var(--muted)" }}>—</span>
          )}
        </td>
        <td className="px-4 py-3 text-xs" style={{ color: "var(--muted)" }}>
          {venue.dateUpdated ? new Date(venue.dateUpdated).toLocaleDateString() : "—"}
        </td>
        <td className="px-4 py-3 text-right">
          {venue.website && (
            <a
              href={venue.website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex p-1.5 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-purple-600" />
            </a>
          )}
        </td>
      </tr>
      {open && hasIncentives && (
        <tr style={{ borderBottom: "1px solid var(--border)" }}>
          <td colSpan={6} className="px-4 pb-3 pt-0">
            <div className="ml-6 rounded-xl border p-3" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--muted)" }}>
                Incentives
              </p>
              {venue.incentives.map((inc, i) => (
                <IncentiveRow key={inc.id ?? i} inc={inc} />
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function MySQLVenuesPage() {
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("all");
  const [page, setPage] = useState(1);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchVenues = useCallback(async (s: string, src: string, p: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ search: s, source: src, page: String(p), limit: "25" });
      const res = await fetch(`/api/admin/mysql-venues?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setVenues(data.venues);
      setPagination(data.pagination);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchVenues(search, source, 1);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search, source, fetchVenues]);

  // Page changes are immediate
  useEffect(() => {
    fetchVenues(search, source, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const claimedCount = venues.filter((v) => v.source === "partner_portal").length;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>Mobile App Venues</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            {pagination
              ? `${pagination.total.toLocaleString()} total venues in the mobile database`
              : "All venues from the DigitalOcean MySQL database"}
          </p>
        </div>
        <button
          onClick={() => fetchVenues(search, source, page)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-colors hover:bg-purple-50"
          style={{ borderColor: "var(--border)", color: "var(--muted)" }}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--muted)" }} />
          <input
            type="text"
            placeholder="Search by name or city…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--fg)" }}
          />
        </div>
        <select
          value={source}
          onChange={(e) => { setSource(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--fg)" }}
        >
          <option value="all">All sources</option>
          <option value="partner_portal">Partner Portal only</option>
          <option value="connectlive">ConnectLive / unclaimed</option>
        </select>
      </div>

      {/* Stats strip */}
      {pagination && (
        <div className="flex gap-4 mb-4 text-sm" style={{ color: "var(--muted)" }}>
          <span>Showing {((page - 1) * 25) + 1}–{Math.min(page * 25, pagination.total)} of {pagination.total.toLocaleString()}</span>
          {source === "all" && claimedCount > 0 && (
            <span className="text-purple-600">{claimedCount} claimed on this page</span>
          )}
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border shadow-sm overflow-hidden" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        {error ? (
          <p className="px-6 py-12 text-center text-red-500">{error}</p>
        ) : (
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
              ) : (
                venues.map((v) => <VenueRow key={v.mysqlId} venue={v} />)
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            disabled={page === 1 || loading}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 rounded-xl border text-sm disabled:opacity-40 hover:bg-purple-50 transition-colors"
            style={{ borderColor: "var(--border)", color: "var(--fg)" }}
          >
            Previous
          </button>
          <span className="text-sm px-2" style={{ color: "var(--muted)" }}>
            Page {page} of {pagination.pages}
          </span>
          <button
            disabled={page === pagination.pages || loading}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 rounded-xl border text-sm disabled:opacity-40 hover:bg-purple-50 transition-colors"
            style={{ borderColor: "var(--border)", color: "var(--fg)" }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
