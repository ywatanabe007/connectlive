import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Users, Building2, Zap, Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || role !== "ADMIN") redirect("/login");

  const [userCount, venueCount, incentiveCount, eventCount] = await Promise.all([
    db.user.count(),
    db.venue.count(),
    db.incentive.count(),
    db.event.count(),
  ]);

  const recentVenues = await db.venue.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    include: {
      owner: { select: { email: true, name: true } },
      _count: { select: { incentives: true, events: true } },
    },
  });

  const stats = [
    { label: "Total Users", value: userCount, icon: Users, color: "bg-blue-100 text-blue-600" },
    { label: "Venues", value: venueCount, icon: Building2, color: "bg-purple-100 text-purple-600" },
    { label: "Incentives", value: incentiveCount, icon: Zap, color: "bg-amber-100 text-amber-600" },
    { label: "Events", value: eventCount, icon: Calendar, color: "bg-emerald-100 text-emerald-600" },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7C3AED] via-[#D946EF] to-[#F97316] flex items-center justify-center">
            <span className="text-white font-bold text-xs">CL</span>
          </div>
          <span className="font-bold" style={{ color: "var(--fg)" }}>ConnectLive</span>
        </div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>Admin Overview</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          Platform-wide stats and venue management
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-2xl border p-5 shadow-sm"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center mb-3`}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-3xl font-bold" style={{ color: "var(--fg)" }}>{value}</p>
            <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Recent Venues */}
      <div
        className="rounded-2xl border shadow-sm overflow-hidden"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <div className="px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <h2 className="font-semibold" style={{ color: "var(--fg)" }}>Recent Venues</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid var(--border)` }}>
                {["Venue", "Owner", "Type", "City", "Incentives", "Events", "Created"].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "var(--muted)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
              {recentVenues.map((venue) => (
                <tr key={venue.id} className="hover:opacity-80 transition-opacity">
                  <td className="px-6 py-4 font-medium" style={{ color: "var(--fg)" }}>
                    {venue.name}
                  </td>
                  <td className="px-6 py-4" style={{ color: "var(--muted)" }}>
                    {venue.owner.name ?? venue.owner.email}
                  </td>
                  <td className="px-6 py-4" style={{ color: "var(--muted)" }}>
                    {venue.type}
                  </td>
                  <td className="px-6 py-4" style={{ color: "var(--muted)" }}>
                    {venue.city}, {venue.state}
                  </td>
                  <td className="px-6 py-4 text-center" style={{ color: "var(--fg)" }}>
                    {venue._count.incentives}
                  </td>
                  <td className="px-6 py-4 text-center" style={{ color: "var(--fg)" }}>
                    {venue._count.events}
                  </td>
                  <td className="px-6 py-4" style={{ color: "var(--muted)" }}>
                    {new Date(venue.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {recentVenues.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center" style={{ color: "var(--muted)" }}>
                    No venues yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
