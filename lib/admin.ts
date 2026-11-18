import { auth } from "@/auth";
import { redirect } from "next/navigation";

export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * A user is an admin if their role is ADMIN (set on the Admin → Users page) or
 * their email is in ADMIN_EMAILS (bootstrap list, so there's always a way in).
 */
export function isAdmin(user: { email?: string | null; role?: string } | undefined): boolean {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  return getAdminEmails().includes((user.email ?? "").toLowerCase());
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  if (!isAdmin(session.user as { email?: string | null; role?: string })) {
    // Signed in but not an admin — send them home rather than to /login,
    // which made it look like their sign-in had failed.
    redirect("/");
  }

  return session;
}
