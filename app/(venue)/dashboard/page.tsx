import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Zap, Calendar, TrendingUp, Plus, ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const venue = await db.venue.findUnique({
    where: { ownerId: session.user.id },
    include: {
      incentives: {
        where: { status: "ACTIVE" },
        include: { redemptions: true },
        orderBy: { startAt: "asc" },
      },
      events: {
        where: {
          status: { in: ["UPCOMING", "LIVE"] },
          date: { gte: new Date() },
        },
        orderBy: { date: "asc" },
        take: 5,
      },
    },
  });

  if (!venue) redirect("/onboarding");

  const activeIncentivesCount = venue.incentives.length;
  const totalRedemptions = venue.incentives.reduce(
    (sum, i) => sum + i.redemptions.length,
    0
  );
  const upcomingEventsCount = venue.events.length;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>
          Dashboard
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          {venue.name} · {venue.city}, {venue.state}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          {
            label: "Active Incentives",
            value: activeIncentivesCount,
            icon: Zap,
            iconBg: "bg-purple-100",
            iconColor: "text-purple-600",
            href: "/incentives",
          },
          {
            label: "Total Redemptions",
            value: totalRedemptions,
            icon: TrendingUp,
            iconBg: "bg-emerald-100",
            iconColor: "text-emerald-600",
            href: "/incentives",
          },
          {
            label: "Upcoming Events",
            value: upcomingEventsCount,
            icon: Calendar,
            iconBg: "bg-amber-100",
            iconColor: "text-amber-600",
            href: "/events",
          },
        ].map(({ label, value, icon: Icon, iconBg, iconColor, href }) => (
          <Link
            key={label}
            href={href}
            className="rounded-2xl p-6 border shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.99] transition-all group"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium" style={{ color: "var(--muted)" }}>
                {label}
              </span>
              <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${iconColor}`} />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <p className="text-4xl font-bold" style={{ color: "var(--fg)" }}>
                {value}
              </p>
              <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--muted)" }} />
            </div>
          </Link>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Active Incentives */}
        <div
          className="rounded-2xl border shadow-sm overflow-hidden"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <div
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{ borderColor: "var(--border)" }}
          >
            <h2 className="font-semibold" style={{ color: "var(--fg)" }}>
              Active Incentives
            </h2>
            <Link
              href="/incentives"
              className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {venue.incentives.slice(0, 5).map((incentive) => (
              <div
                key={incentive.id}
                className="flex items-center justify-between px-6 py-4"
              >
                <div className="min-w-0 flex-1 mr-3">
                  <p className="font-medium text-sm truncate" style={{ color: "var(--fg)" }}>
                    {incentive.title}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                    {incentive.category} · {incentive.redemptionCount} redemptions
                  </p>
                </div>
                <StatusBadge
                  startAt={incentive.startAt.toISOString()}
                  endAt={incentive.endAt.toISOString()}
                />
              </div>
            ))}

            {venue.incentives.length === 0 && (
              <div className="px-6 py-10 text-center" style={{ color: "var(--muted)" }}>
                <Zap className="w-8 h-8 mx-auto mb-2 opacity-25" />
                <p className="text-sm">No active incentives yet</p>
                <Link
                  href="/incentives"
                  className="mt-3 inline-block text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  Create your first incentive →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div
          className="rounded-2xl border shadow-sm overflow-hidden"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <div
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{ borderColor: "var(--border)" }}
          >
            <h2 className="font-semibold" style={{ color: "var(--fg)" }}>
              Upcoming Events
            </h2>
            <Link
              href="/events"
              className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {venue.events.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between px-6 py-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate" style={{ color: "var(--fg)" }}>
                    {event.title}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                    {new Date(event.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    · {event.startTime}
                    {event.coverCharge && event.coverCharge > 0
                      ? ` · $${event.coverCharge} cover`
                      : " · Free"}
                  </p>
                </div>
                <Calendar className="w-4 h-4 flex-shrink-0 ml-3" style={{ color: "var(--muted)" }} />
              </div>
            ))}

            {venue.events.length === 0 && (
              <div className="px-6 py-10 text-center" style={{ color: "var(--muted)" }}>
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-25" />
                <p className="text-sm">No upcoming events yet</p>
                <Link
                  href="/events"
                  className="mt-3 inline-block text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  Add your first event →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/incentives"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-fuchsia-500 hover:opacity-90 active:scale-[0.98] transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          Add Incentive
        </Link>
        <Link
          href="/events"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold border hover:opacity-80 transition-opacity"
          style={{ borderColor: "var(--border)", color: "var(--fg)" }}
        >
          <Plus className="w-4 h-4" />
          Add Event
        </Link>
      </div>
    </div>
  );
}
