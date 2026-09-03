import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminVenueActions } from "./AdminVenueActions";

type Props = { params: Promise<{ id: string }> };

export default async function AdminVenueDetailPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;

  const venue = await db.venue.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, email: true, name: true, role: true, createdAt: true } },
      incentives: {
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { redemptions: true } } },
      },
      _count: { select: { events: true } },
    },
  });

  if (!venue) notFound();

  const totalRedemptions = venue.incentives.reduce((sum, i) => sum + i._count.redemptions, 0);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link href="/admin/venues" className="inline-flex items-center gap-1.5 text-sm mb-6 hover:text-purple-600 transition-colors" style={{ color: "var(--muted)" }}>
        <ArrowLeft className="w-4 h-4" /> Back to venues
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          {venue.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={venue.imageUrl} alt={venue.name} className="w-16 h-16 rounded-xl object-cover border" style={{ borderColor: "var(--border)" }} />
          )}
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>{venue.name}</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
              {venue.address}, {venue.city}, {venue.state} {venue.zip}
            </p>
          </div>
        </div>
        <AdminVenueActions venue={venue} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Incentives", value: venue.incentives.length },
          { label: "Redemptions", value: totalRedemptions },
          { label: "Events", value: venue._count.events },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl border p-4 shadow-sm" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <p className="text-2xl font-bold" style={{ color: "var(--fg)" }}>{value}</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Venue details */}
        <div className="rounded-2xl border p-5 shadow-sm" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <h2 className="font-semibold mb-4" style={{ color: "var(--fg)" }}>Venue Details</h2>
          <dl className="space-y-2 text-sm">
            {[
              ["Business type", venue.businessType ?? "—"],
              ["Category", venue.experienceCategory ?? "—"],
              ["Phone", venue.phone ?? "—"],
              ["Website", venue.website ?? "—"],
              ["Timezone", venue.timeZone ?? "—"],
              ["Group friendly", venue.groupFriendly ? "Yes" : "No"],
              ["Coordinates", `${venue.lat.toFixed(4)}, ${venue.lng.toFixed(4)}`],
            ].map(([k, val]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt style={{ color: "var(--muted)" }}>{k}</dt>
                <dd className="font-medium text-right truncate" style={{ color: "var(--fg)" }}>{val}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Owner details */}
        <div className="rounded-2xl border p-5 shadow-sm" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <h2 className="font-semibold mb-4" style={{ color: "var(--fg)" }}>Owner Account</h2>
          <dl className="space-y-2 text-sm">
            {[
              ["Name", venue.owner.name ?? "—"],
              ["Email", venue.owner.email],
              ["Role", venue.owner.role],
              ["Joined", new Date(venue.owner.createdAt).toLocaleDateString()],
              ["Venue created", new Date(venue.createdAt).toLocaleDateString()],
            ].map(([k, val]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt style={{ color: "var(--muted)" }}>{k}</dt>
                <dd className="font-medium text-right truncate" style={{ color: "var(--fg)" }}>{val}</dd>
              </div>
            ))}
          </dl>
          {venue.description && (
            <div className="mt-4 pt-4 border-t text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
              <p className="font-medium mb-1" style={{ color: "var(--fg)" }}>Description</p>
              <p>{venue.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Incentives */}
      <div className="rounded-2xl border shadow-sm overflow-hidden" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <h2 className="font-semibold" style={{ color: "var(--fg)" }}>Incentives ({venue.incentives.length})</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)" }}>
              <th className="text-left px-6 py-3 font-medium">Title</th>
              <th className="text-left px-6 py-3 font-medium">Category</th>
              <th className="text-center px-6 py-3 font-medium">Status</th>
              <th className="text-right px-6 py-3 font-medium">Redemptions</th>
            </tr>
          </thead>
          <tbody>
            {venue.incentives.map((inc) => (
              <tr key={inc.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td className="px-6 py-3 font-medium" style={{ color: "var(--fg)" }}>{inc.title}</td>
                <td className="px-6 py-3" style={{ color: "var(--muted)" }}>{inc.category}</td>
                <td className="px-6 py-3 text-center">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    inc.status === "ACTIVE" ? "bg-emerald-50 text-emerald-600" :
                    inc.status === "PAUSED" ? "bg-yellow-50 text-yellow-600" :
                    "bg-gray-100 text-gray-500"
                  }`}>{inc.status}</span>
                </td>
                <td className="px-6 py-3 text-right" style={{ color: "var(--muted)" }}>{inc._count.redemptions}</td>
              </tr>
            ))}
            {venue.incentives.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-8 text-center" style={{ color: "var(--muted)" }}>No incentives yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
