"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Zap, Calendar, Settings } from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/incentives", icon: Zap, label: "Incentives" },
  { href: "/events", icon: Calendar, label: "Events" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 p-4 space-y-1">
      {navItems.map(({ href, icon: Icon, label }) => {
        const isActive = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              isActive
                ? "bg-gradient-to-r from-purple-600/15 to-fuchsia-500/10 text-purple-700 font-semibold"
                : "hover:bg-purple-50 hover:text-purple-700"
            }`}
            style={isActive ? undefined : { color: "var(--muted)" }}
          >
            <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-purple-600" : ""}`} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
