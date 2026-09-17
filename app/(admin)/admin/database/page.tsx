"use client";

import { useState, useRef, useCallback } from "react";
import { Search, Database, X, ChevronDown, ChevronUp, ExternalLink, RefreshCw } from "lucide-react";

type MySQLRow = {
  id: number;
  source: string | null;
  source_event_id: string | null;
  event_title: string | null;
  location_name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  business_type: string | null;
  experience_category: string | null;
  group_friendly: string | null;
  image_url: string | null;
  event_url: string | null;
  description: string | null;
  incentives: string | null;
  incentive_hint: string | null;
  incentives_json: any;
  latitude: number | null;
  longitude: number | null;
  date_updated: string | null;
};

function SourceBadge({ source }: { source: string | null }) {
  if (source === "partner_portal") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
        Portal
      </span>
    );
  }
  if (source === "partner_event") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
        Event
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-600">
      ConnectLive
    </span>
  );
}

function RowDetail({ row, onClose }: { row: MySQLRow; onClose: () => void }) {
  const name = row.event_title || row.location_name || "—";

  let incentives: any[] = [];
  try {
    const raw = row.incentives_json;
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    incentives = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
  } catch {}

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border shadow-xl"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <SourceBadge source={row.source} />
              <span className="text-xs font-mono" style={{ color: "var(--muted)" }}>id={row.id}</span>
            </div>
            <h2 className="text-base font-bold truncate" style={{ color: "var(--fg)" }}>{name}</h2>
          </div>
          <button onClick={onClose} className="ml-4 p-1 rounded-lg hover:bg-neutral-100 flex-shrink-0">
            <X className="w-5 h-5" style={{ color: "var(--muted)" }} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Image */}
          {row.image_url && (
            <img src={row.image_url} alt={name} className="w-full h-48 object-cover rounded-xl" />
          )}

          {/* Core fields */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--muted)" }}>Location</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Address" value={row.address} />
              <Field label="City" value={row.city} />
              <Field label="State" value={row.state} />
              <Field label="ZIP" value={row.zip_code} />
              <Field label="Latitude" value={row.latitude?.toString()} />
              <Field label="Longitude" value={row.longitude?.toString()} />
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--muted)" }}>Details</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Business type" value={row.business_type} />
              <Field label="Experience" value={row.experience_category} />
              <Field label="Group friendly" value={row.group_friendly} />
              <Field label="Source" value={row.source} />
              <Field label="Portal ID" value={row.source_event_id} mono />
              <Field label="Last updated" value={row.date_updated ? new Date(row.date_updated).toLocaleString() : null} />
            </div>
          </section>

          {row.description && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--muted)" }}>Description</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--fg)" }}>{row.description}</p>
            </section>
          )}

          {row.event_url && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--muted)" }}>Website</h3>
              <a href={row.event_url} target="_blank" rel="noopener noreferrer"
                className="text-sm text-purple-600 hover:underline flex items-center gap-1 break-all">
                {row.event_url} <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </a>
            </section>
          )}

          {/* Incentives */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--muted)" }}>
              Incentives {incentives.length > 0 ? `(${incentives.length})` : ""}
            </h3>
            {incentives.length > 0 ? (
              <div className="space-y-3">
                {incentives.map((inc: any, i: number) => (
                  <div key={i} className="p-3 rounded-xl border text-sm space-y-1" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
                    <p className="font-semibold" style={{ color: "var(--fg)" }}>{inc.title ?? "—"}</p>
                    {inc.incentives && <p style={{ color: "var(--muted)" }}>{inc.incentives}</p>}
                    {inc.schedule && <p className="text-xs" style={{ color: "var(--muted)" }}>🕐 {inc.schedule}</p>}
                    {inc.incentive_hint && <p className="text-xs italic" style={{ color: "var(--muted)" }}>💡 {inc.incentive_hint}</p>}
                  </div>
                ))}
              </div>
            ) : row.incentives ? (
              <p className="text-sm" style={{ color: "var(--fg)" }}>{row.incentives}</p>
            ) : (
              <p className="text-sm" style={{ color: "var(--muted)" }}>No incentives</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, mono = false }: { label: string; value: string | null | undefined; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium mb-0.5" style={{ color: "var(--muted)" }}>{label}</p>
      <p className={`text-sm break-all ${mono ? "font-mono text-xs" : ""}`} style={{ color: value ? "var(--fg)" : "var(--muted)" }}>
        {value ?? "—"}
      </p>
    </div>
  );
}

export default function DatabasePage() {
  const [query, setQuery] = useState("");
  const [tableMode, setTableMode] = useState<"staging" | "prod">("staging");
  const [rows, setRows] = useState<MySQLRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [selectedRow, setSelectedRow] = useState<MySQLRow | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const search = useCallback(async (q: string, table: "staging" | "prod") => {
    if (q.trim().length < 2) return;
    setLoading(true);
    setError("");
    setRows([]);
    setSearched(true);
    try {
      const params = new URLSearchParams({ q: q.trim(), table });
      const res = await fetch(`/api/admin/mysql-raw?${params}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Query failed");
      setRows(data.rows ?? []);
    } catch (err: any) {
      setError(err.message ?? "Query failed");
    }
    setLoading(false);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    search(query, tableMode);
  }

  const inputCls = "w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all";
  const inputStyle = { background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-1">
          <Database className="w-6 h-6 text-purple-600" />
          <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>MySQL Explorer</h1>
        </div>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Search and inspect venue rows directly in the DigitalOcean database — no Workbench needed.
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-3">
          {/* Table toggle */}
          <div
            className="flex rounded-xl border overflow-hidden flex-shrink-0 text-sm font-medium"
            style={{ borderColor: "var(--border)" }}
          >
            {(["staging", "prod"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setTableMode(t); if (searched) search(query, t); }}
                className={`px-4 py-2.5 transition-colors ${tableMode === t ? "bg-purple-600 text-white" : ""}`}
                style={tableMode === t ? {} : { color: "var(--muted)", background: "var(--card)" }}
              >
                {t === "staging" ? "Staging" : "Production"}
              </button>
            ))}
          </div>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--muted)" }} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by venue name, address, or city…"
              className={`${inputCls} pl-10 pr-4`}
              style={inputStyle}
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(""); setRows([]); setSearched(false); inputRef.current?.focus(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4" style={{ color: "var(--muted)" }} />
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || query.trim().length < 2}
            className="px-5 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-colors disabled:opacity-40 flex items-center gap-2 flex-shrink-0"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Search
          </button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Results */}
      {searched && !loading && (
        <div
          className="rounded-2xl border shadow-sm overflow-hidden"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <div className="px-6 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
            <p className="text-sm font-medium" style={{ color: "var(--muted)" }}>
              {rows.length === 0
                ? "No results"
                : `${rows.length} result${rows.length !== 1 ? "s" : ""} in ${tableMode === "staging" ? "staging" : "production"}`}
            </p>
          </div>

          {rows.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)" }}>
                  <th className="text-left px-6 py-3 font-medium w-8">ID</th>
                  <th className="text-left px-4 py-3 font-medium">Name</th>
                  <th className="text-left px-4 py-3 font-medium">Address</th>
                  <th className="text-left px-4 py-3 font-medium">Source</th>
                  <th className="text-left px-4 py-3 font-medium">Updated</th>
                  <th className="px-4 py-3 w-8" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const name = row.event_title || row.location_name || "—";
                  const expanded = expandedId === row.id;
                  return (
                    <>
                      <tr
                        key={row.id}
                        className="hover:bg-purple-50/30 transition-colors cursor-pointer"
                        style={{ borderBottom: "1px solid var(--border)" }}
                        onClick={() => setExpandedId(expanded ? null : row.id)}
                      >
                        <td className="px-6 py-3 font-mono text-xs" style={{ color: "var(--muted)" }}>{row.id}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium" style={{ color: "var(--fg)" }}>{name}</p>
                          {row.business_type && (
                            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{row.business_type}</p>
                          )}
                        </td>
                        <td className="px-4 py-3" style={{ color: "var(--muted)" }}>
                          {row.address ? `${row.address}, ${row.city}, ${row.state}` : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <SourceBadge source={row.source} />
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: "var(--muted)" }}>
                          {row.date_updated ? new Date(row.date_updated).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setSelectedRow(row); }}
                              className="px-2 py-1 rounded-lg text-xs font-medium border hover:border-purple-400 transition-colors"
                              style={{ borderColor: "var(--border)", color: "var(--muted)" }}
                            >
                              View all
                            </button>
                            {expanded
                              ? <ChevronUp className="w-4 h-4" style={{ color: "var(--muted)" }} />
                              : <ChevronDown className="w-4 h-4" style={{ color: "var(--muted)" }} />
                            }
                          </div>
                        </td>
                      </tr>
                      {expanded && (
                        <tr key={`${row.id}-expanded`} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td colSpan={6} className="px-6 py-4" style={{ background: "var(--bg)" }}>
                            <div className="grid grid-cols-3 gap-4 text-xs">
                              <div>
                                <p className="font-semibold mb-1" style={{ color: "var(--muted)" }}>Experience</p>
                                <p style={{ color: "var(--fg)" }}>{row.experience_category || "—"}</p>
                              </div>
                              <div>
                                <p className="font-semibold mb-1" style={{ color: "var(--muted)" }}>Group friendly</p>
                                <p style={{ color: "var(--fg)" }}>{row.group_friendly || "—"}</p>
                              </div>
                              <div>
                                <p className="font-semibold mb-1" style={{ color: "var(--muted)" }}>Portal ID</p>
                                <p className="font-mono truncate" style={{ color: "var(--fg)" }}>{row.source_event_id || "—"}</p>
                              </div>
                              {row.incentives && (
                                <div className="col-span-3">
                                  <p className="font-semibold mb-1" style={{ color: "var(--muted)" }}>Incentive summary</p>
                                  <p style={{ color: "var(--fg)" }}>{row.incentives}</p>
                                </div>
                              )}
                              {row.description && (
                                <div className="col-span-3">
                                  <p className="font-semibold mb-1" style={{ color: "var(--muted)" }}>Description</p>
                                  <p className="line-clamp-3" style={{ color: "var(--fg)" }}>{row.description}</p>
                                </div>
                              )}
                              {row.event_url && (
                                <div className="col-span-3">
                                  <p className="font-semibold mb-1" style={{ color: "var(--muted)" }}>Website</p>
                                  <a href={row.event_url} target="_blank" rel="noopener noreferrer"
                                    className="text-purple-600 hover:underline flex items-center gap-1">
                                    {row.event_url} <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {!searched && (
        <div
          className="rounded-2xl border border-dashed p-12 text-center"
          style={{ borderColor: "var(--border)" }}
        >
          <Database className="w-10 h-10 mx-auto mb-3 opacity-30" style={{ color: "var(--muted)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--muted)" }}>
            Type a venue name, address, or city to search the database
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--muted)", opacity: 0.7 }}>
            Toggle between staging and production tables above
          </p>
        </div>
      )}

      {/* Row detail modal */}
      {selectedRow && <RowDetail row={selectedRow} onClose={() => setSelectedRow(null)} />}
    </div>
  );
}
