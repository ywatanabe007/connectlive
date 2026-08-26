import { requireAdmin } from "@/lib/admin";
import { signOut } from "@/auth";
import { AdminSidebarNav } from "@/components/AdminSidebarNav";
import { LogOut, ShieldCheck } from "lucide-react";

async function SignOutForm() {
  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }
  return (
    <form action={handleSignOut}>
      <button
        type="submit"
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full transition-all hover:bg-red-50 hover:text-red-600"
        style={{ color: "var(--muted)" }}
      >
        <LogOut className="w-4 h-4 flex-shrink-0" />
        Sign out
      </button>
    </form>
  );
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Sidebar */}
      <aside
        className="w-64 border-r flex-shrink-0 flex flex-col sticky top-0 h-screen"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        {/* Logo */}
        <div className="p-5 border-b flex-shrink-0" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="ConnectLive" className="w-8 h-8 object-contain flex-shrink-0" />
            <div>
              <p className="font-bold text-sm leading-tight" style={{ color: "var(--fg)" }}>
                ConnectLive
              </p>
              <p className="text-xs flex items-center gap-1 text-purple-600 font-semibold">
                <ShieldCheck className="w-3 h-3" /> Admin
              </p>
            </div>
          </div>
        </div>

        <AdminSidebarNav />

        {/* User + sign out */}
        <div className="p-4 flex-shrink-0 border-t space-y-1" style={{ borderColor: "var(--border)" }}>
          <p className="text-xs px-3 truncate" style={{ color: "var(--muted)" }}>
            {session.user?.email}
          </p>
          <SignOutForm />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  );
}
