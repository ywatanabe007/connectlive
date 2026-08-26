"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Building2, Tag, BarChart2, Users } from "lucide-react";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/venues", label: "Venues", icon: Building2 },
  { href: "/admin/incentives", label: "Incentives", icon: Tag },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/admin/users", label: "Users", icon: Users },
];

export function AdminSidebarNav() {
  const path = usePathname();

  return (
    <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
      {NAV.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? path === href : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              active
                ? "bg-purple-600 text-white shadow-sm"
                : "hover:bg-purple-50/60"
            }`}
            style={active ? {} : { color: "var(--muted)" }}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
