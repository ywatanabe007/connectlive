"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

const ROLES = ["USER", "VENUE_OWNER", "ADMIN"];

export function AdminUserActions({ userId, currentRole }: { userId: string; currentRole: string }) {
  const [role, setRole] = useState(currentRole);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function changeRole(newRole: string) {
    if (newRole === role) return;
    setSaving(true);
    setMsg("");
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      setRole(newRole);
      setMsg("Saved");
    } else {
      setMsg("Failed");
    }
    setSaving(false);
    setTimeout(() => setMsg(""), 2000);
  }

  return (
    <div className="flex items-center gap-2">
      {msg && <span className="text-xs text-purple-600">{msg}</span>}
      {saving && <Loader2 className="w-3 h-3 animate-spin text-purple-600" />}
      <select
        value={role}
        onChange={(e) => changeRole(e.target.value)}
        disabled={saving}
        className="text-xs px-2 py-1 rounded-lg border focus:outline-none focus:ring-1 focus:ring-purple-400 disabled:opacity-50"
        style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }}
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
    </div>
  );
}
