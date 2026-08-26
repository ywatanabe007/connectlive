import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import Link from "next/link";

export default async function AdminIncentivesPage() {
  await requireAdmin();

  const incentives = await db.incentive.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      venue: { select: { id: true, name: true, city: true, state: true } },
      _count: { select: { redemptions: true } },
    },
  });

  const byStatus = {
    ACTIVE: incentives.filter((i) => i.status === "ACTIVE").length,
    PAUSED: incentives.filter((i) => i.status === "PAUSED").length,
    EXPIRED: incentives.filter((i) => i.status === "EXPIRED").length,
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>All Incentives</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          {incentives.length} total · {byStatus.ACTIVE} active · {byStatus.PAUSED} paused · {byStatus.EXPIRED} expired
        </p>
      </div>

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
            {incentives.map((inc) => (
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
                    inc.status === "ACTIVE" ? "bg-emerald-50 text-emerald-600" :
                    inc.status === "PAUSED" ? "bg-yellow-50 text-yellow-600" :
                    "bg-gray-100 text-gray-500"
                  }`}>{inc.status}</span>
                </td>
                <td className="px-6 py-3 text-right" style={{ color: "var(--fg)" }}>{inc._count.redemptions}</td>
                <td className="px-6 py-3 text-right text-xs" style={{ color: "var(--muted)" }}>
                  {new Date(inc.endAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {incentives.length === 0 && (
              <tr><td colSpan={7} className="px-6 py-12 text-center" style={{ color: "var(--muted)" }}>No incentives yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
