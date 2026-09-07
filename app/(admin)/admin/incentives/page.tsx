"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Search, RefreshCw, Tag, Database, Building2, ChevronDown, ChevronUp, ChevronsUpDown, X } from "lucide-react";

// ─── Partner Portal types ────────────────────────────────────────────────────

type PortalIncentive = {
  id: string;
  title: string;
  teaserText: string | null;
  category: string;
  recurrence: string;
  status: "ACTIVE" | "PAUSED" | "EXPIRED";
  endAt: string;
  venue: { id: string; name: string; city: string; state: string };
  _count: { redemptions: number };
};

// ─── MySQL types ─────────────────────────────────────────────────────────────

type MySQLIncentive = {
  venueId: number;
  venueName: string;
  city: string;
  state: string;
  source: string;
  title: string;
  category: string;
  schedule: string | null;
  description: string | null;
  hint: string | null;
  startDate: string | null;
  endDate: string | null;
  groupFriendly: boolean;
};

type Pagination = { total: number; page: number; limit: number; pages: number };

// ─── Partner Portal tab ──────────────────────────────────────────────────────

function PortalIncentivesTab() {
  const [incentives, setIncentives] = useState<PortalIncentive[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/portal-incentives")
      .then((r) => r.json())
      .then((d) => setIncentives(d.incentives ?? []))
      .finally(() => setLoading(false));
  }, []);

  const byStatus = {
    ACTIVE:  incentives.filter((i) => i.status === "ACTIVE").length,
    PAUSED:  incentives.filter((i) => i.status === "PAUSED").length,
    EXPIRED: incentives.filter((i) => i.status === "EXPIRED").length,
  };

  return (
    <div>
      {!loading && (
        <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
          {incentives.length} total · {byStatus.ACTIVE} active · {byStatus.PAUSED} paused · {byStatus.EXPIRED} expired
        </p>
      )}
      <div className="rounded-2xl border shadow-sm overflow-hidden" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)", background: "var(--bg)" }}>
              <th className="text-left px-6 py-3 font-medium">Title</th>
              <th className="text-left px-6 py-3 font-medium">Venue</th>
              <th className="text-left px-6 py-3 font-medium">Category</th>
              <th className="text-left px-6 py-3 font-medium">Recurrence</th>
              <th className="text-center px-6 py-3 font-medium">Status</th>
              <th className="text-right px-6 py-3 font-medium">Redemptions</th>
              <th className="text-right px-6 py-3 font-medium">Ends</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center" style={{ color: "var(--muted)" }}>Loading…</td></tr>
            ) : incentives.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center" style={{ color: "var(--muted)" }}>No incentives yet.</td></tr>
            ) : incentives.map((inc) => (
              <tr key={inc.id} className="hover:bg-purple-50/20 transition-colors" style={{ borderBottom: "1px solid var(--border)" }}>
                <td className="px-6 py-3">
                  <p className="font-medium" style={{ color: "var(--fg)" }}>{inc.title}</p>
                  {inc.teaserText && <p className="text-xs mt-0.5 truncate max-w-[200px]" style={{ color: "var(--muted)" }}>{inc.teaserText}</p>}
                </td>
                <td className="px-6 py-3">
                  <Link href={`/admin/venues/${inc.venue.id}`} className="hover:text-purple-600 transition-colors" style={{ color: "var(--fg)" }}>
                    {inc.venue.name}
                  </Link>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{inc.venue.city}, {inc.venue.state}</p>
                </td>
                <td className="px-6 py-3 text-xs" style={{ color: "var(--muted)" }}>{inc.category}</td>
                <td className="px-6 py-3 text-xs" style={{ color: "var(--muted)" }}>{inc.recurrence.replace("_", "-")}</td>
                <td className="px-6 py-3 text-center">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    inc.status === "ACTIVE"  ? "bg-emerald-50 text-emerald-600" :
                    inc.status === "PAUSED"  ? "bg-yellow-50 text-yellow-600"  :
                    "bg-gray-100 text-gray-500"
                  }`}>{inc.status}</span>
                </td>
                <td className="px-6 py-3 text-right" style={{ color: "var(--fg)" }}>{inc._count.redemptions}</td>
                <td className="px-6 py-3 text-right text-xs" style={{ color: "var(--muted)" }}>
                  {new Date(inc.endAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── All Venues (MySQL) incentives tab ───────────────────────────────────────

type SortKey = "title" | "venue" | "category" | "source" | "endDate";

function SortIcon({ col, sort, dir }: { col: SortKey; sort: SortKey; dir: "asc" | "desc" }) {
  if (col !== sort) return <ChevronsUpDown className="w-3 h-3 ml-1 opacity-40 inline" />;
  return dir === "asc"
    ? <ChevronUp className="w-3 h-3 ml-1 inline text-purple-600" />
    : <ChevronDown className="w-3 h-3 ml-1 inline text-purple-600" />;
}

const inputCls = "w-full px-2 py-1 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-purple-400";
const inputSty = { background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" };

function AllIncentivesTab() {
  const [search, setSearch]         = useState("");
  const [page, setPage]             = useState(1);
  const [sort, setSort]             = useState<SortKey>("title");
  const [dir, setDir]               = useState<"asc" | "desc">("asc");
  const [incentives, setIncentives] = useState<MySQLIncentive[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading]       = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchIncentives = useCallback(async (s: string, p: number, sortCol: SortKey, sortDir: "asc" | "desc") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search: s, page: String(p), limit: "50" });
      const res = await fetch(`/api/admin/mysql-incentives?${params}`);
      const data = await res.json();

      // Client-side sort (incentives are already flattened)
      let list: MySQLIncentive[] = data.incentives ?? [];
      const keyFn: Record<SortKey, (i: MySQLIncentive) => string> = {
        title:   (i) => i.title.toLowerCase(),
        venue:   (i) => i.venueName.toLowerCase(),
        category:(i) => i.category.toLowerCase(),
        source:  (i) => i.source.toLowerCase(),
        endDate: (i) => i.endDate ?? "",
      };
      list = list.sort((a, b) => {
        const av = keyFn[sortCol](a), bv = keyFn[sortCol](b);
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      });

      setIncentives(list);
      setPagination(data.pagination ?? null);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setPage(1); fetchIncentives(search, 1, sort, dir); }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search, fetchIncentives]); // eslint-disable-line

  useEffect(() => { fetchIncentives(search, page, sort, dir); }, [page]); // eslint-disable-line
  useEffect(() => { fetchIncentives(search, page, sort, dir); }, [sort, dir]); // eslint-disable-line

  function handleSort(col: SortKey) {
    if (col === sort) setDir((d) => d === "asc" ? "desc" : "asc");
    else { setSort(col); setDir("asc"); }
  }

  const columns: { key: SortKey; label: string; align: string }[] = [
    { key: "title",    label: "Title",    align: "left"  },
    { key: "venue",    label: "Venue",    align: "left"  },
    { key: "category", label: "Category", align: "left"  },
    { key: "source",   label: "Source",   align: "left"  },
    { key: "endDate",  label: "Ends",     align: "right" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--muted)" }} />
          <input type="text" placeholder="Search by title or venue…" value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--fg)" }} />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }}>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {pagination && (
          <p className="text-sm ml-4" style={{ color: "var(--muted)" }}>
            {Number(pagination.total).toLocaleString()} total incentives
          </p>
        )}
      </div>

      <div className="rounded-2xl border shadow-sm overflow-hidden" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)", background: "var(--bg)" }}>
              {columns.map(({ key, label, align }) => (
                <th key={key}
                  className={`px-6 py-3 font-medium text-${align} cursor-pointer select-none hover:text-purple-600 transition-colors whitespace-nowrap`}
                  onClick={() => handleSort(key)}>
                  {label}<SortIcon col={key} sort={sort} dir={dir} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && incentives.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center" style={{ color: "var(--muted)" }}>Loading…</td></tr>
            ) : incentives.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center" style={{ color: "var(--muted)" }}>No incentives found.</td></tr>
            ) : incentives.map((inc, i) => (
              <tr key={`${inc.venueId}-${i}`} className="hover:bg-purple-50/20 transition-colors" style={{ borderBottom: "1px solid var(--border)" }}>
                <td className="px-6 py-3">
                  <p className="font-medium" style={{ color: "var(--fg)" }}>{inc.title}</p>
                  {inc.description && <p className="text-xs mt-0.5 truncate max-w-[220px]" style={{ color: "var(--muted)" }}>{inc.description}</p>}
                  {inc.hint && <p className="text-xs italic mt-0.5" style={{ color: "var(--muted)" }}>Hint: {inc.hint}</p>}
                </td>
                <td className="px-6 py-3">
                  <p className="font-medium text-sm" style={{ color: "var(--fg)" }}>{inc.venueName}</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{inc.city}, {inc.state}</p>
                </td>
                <td className="px-6 py-3 text-xs" style={{ color: "var(--muted)" }}>{inc.category}</td>
                <td className="px-6 py-3">
                  <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{inc.source}</span>
                </td>
                <td className="px-6 py-3 text-right text-xs" style={{ color: "var(--muted)" }}>
                  {inc.endDate ? new Date(inc.endDate).toLocaleDateString() : "—"}
                </td>
              </tr>
            ))}
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

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AdminIncentivesPage() {
  const [tab, setTab] = useState<"portal" | "all">("portal");

  const tabs = [
    { key: "portal", label: "Partner Portal", icon: Building2 },
    { key: "all",    label: "All Venues",      icon: Database  },
  ] as const;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>Incentives</h1>
      </div>

      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === key ? "bg-purple-600 text-white shadow-sm" : "hover:bg-purple-50/60"}`}
            style={tab === key ? {} : { color: "var(--muted)" }}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {tab === "portal" ? <PortalIncentivesTab /> : <AllIncentivesTab />}
    </div>
  );
}
