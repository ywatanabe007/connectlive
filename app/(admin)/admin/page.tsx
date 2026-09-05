import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { getPool } from "@/lib/mysql-sync";
import { Building2, Tag, BarChart2, Users } from "lucide-react";
import Link from "next/link";

const PROD_TABLE = process.env.MYSQL_VENUE_TABLE_PROD ?? process.env.MYSQL_VENUE_TABLE ?? "tbl_venues_near_you_staging";

async function getMySQLVenueCount(): Promise<number> {
  try {
    const pool = getPool();
    const [[row]] = await pool.execute<any[]>(`SELECT COUNT(*) AS total FROM \`${PROD_TABLE}\``);
    return row?.total ?? 0;
  } catch {
    return 0;
  }
}

export default async function AdminOverviewPage() {
  await requireAdmin();

  const [venueCount, userCount, incentiveCount, redemptionCount, recentVenues, mysqlVenueCount] =
    await Promise.all([
      db.venue.count(),
      db.user.count(),
      db.incentive.count({ where: { status: "ACTIVE" } }),
      db.redemption.count(),
      db.venue.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          owner: { select: { email: true } },
          _count: { select: { incentives: true } },
        },
      }),
      getMySQLVenueCount(),
    ]);

  const totalVenues = mysqlVenueCount + venueCount;

  const stats = [
    { label: "Total Venues", value: totalVenues, sublabel: `${mysqlVenueCount.toLocaleString()} mobile · ${venueCount} partner`, icon: Building2, href: "/admin/venues", color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Active Incentives", value: incentiveCount, sublabel: undefined, icon: Tag, href: "/admin/incentives", color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Total Redemptions", value: redemptionCount, sublabel: undefined, icon: BarChart2, href: "/admin/analytics", color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Registered Users", value: userCount, sublabel: undefined, icon: Users, href: "/admin/users", color: "text-orange-600", bg: "bg-orange-50" },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>Admin Overview</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          ConnectLive partner portal — all venues, incentives, and users at a glance.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, sublabel, icon: Icon, href, color, bg }) => (
          <Link
            key={label}
            href={href}
            className="rounded-2xl border p-5 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.99] transition-all"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <div className={`inline-flex p-2 rounded-xl mb-3 ${bg}`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-3xl font-bold" style={{ color: "var(--fg)" }}>{value.toLocaleString()}</p>
            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{label}</p>
            {sublabel && <p className="text-xs mt-1" style={{ color: "var(--muted)", opacity: 0.7 }}>{sublabel}</p>}
          </Link>
        ))}
      </div>

      <div
        className="rounded-2xl border shadow-sm overflow-hidden"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
          <h2 className="font-semibold" style={{ color: "var(--fg)" }}>Recently Joined Venues</h2>
          <Link href="/admin/venues" className="text-sm text-purple-600 hover:underline font-medium">
            View all →
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)" }}>
              <th className="text-left px-6 py-3 font-medium">Venue</th>
              <th className="text-left px-6 py-3 font-medium">Owner email</th>
              <th className="text-left px-6 py-3 font-medium">City</th>
              <th className="text-right px-6 py-3 font-medium">Incentives</th>
            </tr>
          </thead>
          <tbody>
            {recentVenues.map((v) => (
              <tr key={v.id} className="hover:bg-purple-50/30 transition-colors" style={{ borderBottom: "1px solid var(--border)" }}>
                <td className="px-6 py-3 font-medium" style={{ color: "var(--fg)" }}>
                  <Link href={`/admin/venues/${v.id}`} className="hover:text-purple-600">{v.name}</Link>
                </td>
                <td className="px-6 py-3" style={{ color: "var(--muted)" }}>{v.owner.email}</td>
                <td className="px-6 py-3" style={{ color: "var(--muted)" }}>{v.city}, {v.state}</td>
                <td className="px-6 py-3 text-right" style={{ color: "var(--muted)" }}>{v._count.incentives}</td>
              </tr>
            ))}
            {recentVenues.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-8 text-center" style={{ color: "var(--muted)" }}>No venues yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
