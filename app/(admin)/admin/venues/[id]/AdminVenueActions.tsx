"use client";

import { useState } from "react";
import { RefreshCw, ShieldOff, ShieldCheck, Loader2, Trash2, Pencil, X, Save } from "lucide-react";
import { useRouter } from "next/navigation";

type Venue = {
  id: string;
  active: boolean;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string | null;
  website: string | null;
  imageUrl: string | null;
  description: string | null;
  businessType: string | null;
  experienceCategory: string | null;
  groupFriendly: boolean;
  timeZone: string | null;
};

function Field({ label, name, value, onChange, type = "text", textarea = false }: {
  label: string; name: string; value: string; onChange: (v: string) => void;
  type?: string; textarea?: boolean;
}) {
  const base = "w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500";
  const style = { background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" };
  return (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>{label}</label>
      {textarea ? (
        <textarea name={name} value={value} onChange={(e) => onChange(e.target.value)}
          rows={3} className={base} style={style} />
      ) : (
        <input name={name} type={type} value={value} onChange={(e) => onChange(e.target.value)}
          className={base} style={style} />
      )}
    </div>
  );
}

function EditModal({ venue, onClose, onSaved }: { venue: Venue; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name:               venue.name,
    address:            venue.address,
    city:               venue.city,
    state:              venue.state,
    zip:                venue.zip,
    phone:              venue.phone ?? "",
    website:            venue.website ?? "",
    imageUrl:           venue.imageUrl ?? "",
    description:        venue.description ?? "",
    businessType:       venue.businessType ?? "",
    experienceCategory: venue.experienceCategory ?? "",
    timeZone:           venue.timeZone ?? "",
    groupFriendly:      venue.groupFriendly,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/venues/${venue.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form }),
      });
      if (!res.ok) throw new Error("Save failed");
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden" style={{ background: "var(--card)", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <h2 className="font-semibold" style={{ color: "var(--fg)" }}>Edit Venue</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-purple-50 transition-colors" style={{ color: "var(--muted)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-4">
          <Field label="Venue name" name="name" value={form.name} onChange={set("name")} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Business type" name="businessType" value={form.businessType} onChange={set("businessType")} />
            <Field label="Experience category" name="experienceCategory" value={form.experienceCategory} onChange={set("experienceCategory")} />
          </div>
          <Field label="Address" name="address" value={form.address} onChange={set("address")} />
          <div className="grid grid-cols-3 gap-4">
            <Field label="City" name="city" value={form.city} onChange={set("city")} />
            <Field label="State" name="state" value={form.state} onChange={set("state")} />
            <Field label="ZIP" name="zip" value={form.zip} onChange={set("zip")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Phone" name="phone" value={form.phone} onChange={set("phone")} type="tel" />
            <Field label="Website" name="website" value={form.website} onChange={set("website")} type="url" />
          </div>
          <Field label="Image URL" name="imageUrl" value={form.imageUrl} onChange={set("imageUrl")} type="url" />
          <Field label="Description" name="description" value={form.description} onChange={set("description")} textarea />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Timezone" name="timeZone" value={form.timeZone} onChange={set("timeZone")} />
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>Group friendly</label>
              <select value={form.groupFriendly ? "yes" : "no"}
                onChange={(e) => setForm((f) => ({ ...f, groupFriendly: e.target.value === "yes" }))}
                className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }}>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: "var(--border)" }}>
          <button onClick={onClose} disabled={saving}
            className="px-4 py-2 rounded-xl border text-sm transition-colors hover:bg-purple-50"
            style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
            Cancel
          </button>
          <button onClick={save} disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminVenueActions({ venue }: { venue: Venue }) {
  const router = useRouter();
  const [isActive, setIsActive] = useState(venue.active);
  const [syncing, setSyncing]   = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing]   = useState(false);
  const [msg, setMsg]           = useState("");

  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(""), 3000); }

  async function toggleActive() {
    setToggling(true);
    const res = await fetch(`/api/admin/venues/${venue.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !isActive }),
    });
    if (res.ok) { setIsActive((a) => !a); flash(!isActive ? "Venue activated." : "Venue suspended."); }
    else flash("Action failed.");
    setToggling(false);
  }

  async function syncToMySQL() {
    setSyncing(true);
    const res = await fetch(`/api/admin/sync/${venue.id}`, { method: "POST" });
    flash(res.ok ? "Synced to mobile DB." : "Sync failed.");
    setSyncing(false);
  }

  async function deleteVenue() {
    if (!confirm("Delete this venue? The MySQL row will be reset so it can be claimed again. This cannot be undone.")) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/venues/${venue.id}`, { method: "DELETE" });
    if (res.ok) { router.push("/admin/venues"); router.refresh(); }
    else { flash("Delete failed."); setDeleting(false); }
  }

  return (
    <>
      {editing && (
        <EditModal venue={venue} onClose={() => setEditing(false)} onSaved={() => router.refresh()} />
      )}
      <div className="flex items-center gap-2">
        {msg && <span className="text-xs text-purple-600 font-medium">{msg}</span>}
        <button onClick={() => setEditing(true)} disabled={deleting}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all hover:bg-purple-50 hover:border-purple-300 hover:text-purple-600 disabled:opacity-50"
          style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
          <Pencil className="w-4 h-4" /> Edit
        </button>
        <button onClick={syncToMySQL} disabled={syncing || deleting}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 disabled:opacity-50"
          style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
          {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Sync to app
        </button>
        <button onClick={toggleActive} disabled={toggling || deleting}
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all disabled:opacity-50 ${
            isActive ? "border-red-200 text-red-600 hover:bg-red-50" : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
          }`}>
          {toggling ? <Loader2 className="w-4 h-4 animate-spin" /> : isActive ? <><ShieldOff className="w-4 h-4" /> Suspend</> : <><ShieldCheck className="w-4 h-4" /> Activate</>}
        </button>
        <button onClick={deleteVenue} disabled={deleting || syncing || toggling}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-all disabled:opacity-50">
          {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          Delete
        </button>
      </div>
    </>
  );
}
