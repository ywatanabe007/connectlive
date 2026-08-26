import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import Link from "next/link";

export default async function AdminAnalyticsPage() {
  await requireAdmin();

  const [venues, recentRedemptions, totalRedemptions] = await Promise.all([
    db.venue.findMany({
      include: {
        incentives: {
          include: { _count: { select: { redemptions: true } } },
        },
      },
    }),
    db.redemption.findMany({
      orderBy: { redeemedAt: "desc" },
      take: 20,
      include: {
        incentive: {
          select: {
            title: true,
            venue: { select: { id: true, name: true } },
          },
        },
      },
    }),
    db.redemption.count(),
  ]);

  // Aggregate redemptions per venue
  const venueStats = venues
    .map((v) => ({
      id: v.id,
      name: v.name,
      total: v.incentives.reduce((sum, i) => sum + i._count.redemptions, 0),
      incentiveCount: v.incentives.length,
    }))
    .sort((a, b) => b.total - a.total);

  const maxRedemptions = venueStats[0]?.total ?? 1;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>Analytics</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          {totalRedemptions.toLocaleString()} total redemptions across {venues.length} venues
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Redemptions by venue */}
        <div className="rounded-2xl border shadow-sm p-6" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <h2 className="font-semibold mb-5" style={{ color: "var(--fg)" }}>Redemptions by Venue</h2>
          <div className="space-y-3">
            {venueStats.slice(0, 10).map((v) => (
              <div key={v.id}>
                <div className="flex items-center justify-between mb-1">
                  <Link href={`/admin/venues/${v.id}`} className="text-sm font-medium hover:text-purple-600 transition-colors truncate max-w-[160px]" style={{ color: "var(--fg)" }}>
                    {v.name}
                  </Link>
                  <span className="text-sm font-semibold ml-2" style={{ color: "var(--fg)" }}>{v.total}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full transition-all"
                    style={{ width: `${(v.total / maxRedemptions) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {venueStats.length === 0 && (
              <p className="text-sm text-center py-4" style={{ color: "var(--muted)" }}>No redemptions yet.</p>
            )}
          </div>
        </div>

        {/* Recent redemptions */}
        <div className="rounded-2xl border shadow-sm overflow-hidden" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
            <h2 className="font-semibold" style={{ color: "var(--fg)" }}>Recent Redemptions</h2>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {recentRedemptions.map((r) => (
              <div key={r.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>{r.incentive.title}</p>
                  <Link href={`/admin/venues/${r.incentive.venue.id}`} className="text-xs hover:text-purple-600" style={{ color: "var(--muted)" }}>
                    {r.incentive.venue.name}
                  </Link>
                </div>
                <span className="text-xs ml-4 whitespace-nowrap" style={{ color: "var(--muted)" }}>
                  {new Date(r.redeemedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
            {recentRedemptions.length === 0 && (
              <div className="px-6 py-8 text-center text-sm" style={{ color: "var(--muted)" }}>No redemptions yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
