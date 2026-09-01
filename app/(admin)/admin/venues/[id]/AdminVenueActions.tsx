"use client";

import { useState } from "react";
import { RefreshCw, ShieldOff, ShieldCheck, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function AdminVenueActions({ venueId, active }: { venueId: string; active: boolean }) {
  const router = useRouter();
  const [isActive, setIsActive] = useState(active);
  const [syncing, setSyncing] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [msg, setMsg] = useState("");

  async function toggleActive() {
    setToggling(true);
    setMsg("");
    const res = await fetch(`/api/admin/venues/${venueId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !isActive }),
    });
    if (res.ok) {
      setIsActive(!isActive);
      setMsg(!isActive ? "Venue activated." : "Venue suspended.");
    } else {
      setMsg("Action failed.");
    }
    setToggling(false);
    setTimeout(() => setMsg(""), 3000);
  }

  async function syncToMySQL() {
    setSyncing(true);
    setMsg("");
    const res = await fetch(`/api/admin/sync/${venueId}`, { method: "POST" });
    setMsg(res.ok ? "Synced to mobile DB." : "Sync failed.");
    setSyncing(false);
    setTimeout(() => setMsg(""), 3000);
  }

  async function deleteVenue() {
    if (!confirm("Delete this venue? The MySQL row will be reset so it can be claimed again. This cannot be undone.")) return;
    setDeleting(true);
    setMsg("");
    const res = await fetch(`/api/admin/venues/${venueId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin/venues");
      router.refresh();
    } else {
      setMsg("Delete failed.");
      setDeleting(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {msg && <span className="text-xs text-purple-600 font-medium">{msg}</span>}
      <button
        onClick={syncToMySQL}
        disabled={syncing || deleting}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 disabled:opacity-50"
        style={{ borderColor: "var(--border)", color: "var(--muted)" }}
      >
        {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        Sync to app
      </button>
      <button
        onClick={toggleActive}
        disabled={toggling || deleting}
        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all disabled:opacity-50 ${
          isActive
            ? "border-red-200 text-red-600 hover:bg-red-50"
            : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
        }`}
      >
        {toggling ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isActive ? (
          <><ShieldOff className="w-4 h-4" /> Suspend</>
        ) : (
          <><ShieldCheck className="w-4 h-4" /> Activate</>
        )}
      </button>
      <button
        onClick={deleteVenue}
        disabled={deleting || syncing || toggling}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-all disabled:opacity-50"
      >
        {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        Delete
      </button>
    </div>
  );
}
