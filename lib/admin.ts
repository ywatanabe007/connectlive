import { auth } from "@/auth";
import { redirect } from "next/navigation";

export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const adminEmails = getAdminEmails();
  if (!adminEmails.includes((session.user.email ?? "").toLowerCase())) {
    redirect("/login");
  }

  return session;
}
