import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import Link from "next/link";
import { MapPin, ChevronRight, CheckCircle, XCircle } from "lucide-react";

export default async function AdminVenuesPage() {
  await requireAdmin();

  const venues = await db.venue.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      owner: { select: { email: true } },
      _count: { select: { incentives: true, events: true } },
    },
  });

  const activeCount = venues.filter((v) => v.active).length;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>Venues</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            {venues.length} total · {activeCount} active
          </p>
        </div>
      </div>

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
            {venues.map((v) => (
              <tr key={v.id} className="hover:bg-purple-50/20 transition-colors" style={{ borderBottom: "1px solid var(--border)" }}>
                <td className="px-6 py-3">
                  <div>
                    <p className="font-medium" style={{ color: "var(--fg)" }}>{v.name}</p>
                    <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: "var(--muted)" }}>
                      <MapPin className="w-3 h-3" />{v.city}, {v.state}
                    </p>
                  </div>
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
            {venues.length === 0 && (
              <tr><td colSpan={7} className="px-6 py-12 text-center" style={{ color: "var(--muted)" }}>No venues registered yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
