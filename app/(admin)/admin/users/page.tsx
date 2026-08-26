import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { AdminUserActions } from "./AdminUserActions";

export default async function AdminUsersPage() {
  await requireAdmin();

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      venue: { select: { id: true, name: true } },
    },
  });

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>Users</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          {users.length} registered accounts
        </p>
      </div>

      <div className="rounded-2xl border shadow-sm overflow-hidden" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)", background: "var(--bg)" }}>
              <th className="text-left px-6 py-3 font-medium">Email</th>
              <th className="text-left px-6 py-3 font-medium">Name</th>
              <th className="text-left px-6 py-3 font-medium">Role</th>
              <th className="text-left px-6 py-3 font-medium">Venue</th>
              <th className="text-left px-6 py-3 font-medium">Joined</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-purple-50/20 transition-colors" style={{ borderBottom: "1px solid var(--border)" }}>
                <td className="px-6 py-3 font-medium" style={{ color: "var(--fg)" }}>{u.email}</td>
                <td className="px-6 py-3" style={{ color: "var(--muted)" }}>{u.name ?? "—"}</td>
                <td className="px-6 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    u.role === "ADMIN" ? "bg-purple-100 text-purple-700" :
                    u.role === "VENUE_OWNER" ? "bg-blue-50 text-blue-600" :
                    "bg-gray-100 text-gray-500"
                  }`}>{u.role}</span>
                </td>
                <td className="px-6 py-3 text-sm" style={{ color: "var(--muted)" }}>
                  {u.venue ? u.venue.name : "—"}
                </td>
                <td className="px-6 py-3 text-xs" style={{ color: "var(--muted)" }}>
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-3">
                  <AdminUserActions userId={u.id} currentRole={u.role} />
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-12 text-center" style={{ color: "var(--muted)" }}>No users yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
