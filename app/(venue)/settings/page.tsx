"use client";

import { useState, useEffect } from "react";
import { Save, Building2, MapPin, Globe, Phone } from "lucide-react";

const VENUE_TYPES = [
  "Restaurant", "Bar", "Nightclub", "Brewery", "Winery",
  "Coffee Shop", "Live Music Venue", "Comedy Club", "Sports Bar", "Lounge", "Other",
];

type VenueData = {
  id: string;
  name: string;
  type: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string | null;
  website: string | null;
  description: string | null;
  lat: number;
  lng: number;
};

const inputCls =
  "w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all";
const inputStyle = {
  background: "var(--bg)",
  borderColor: "var(--border)",
  color: "var(--fg)",
};

export default function SettingsPage() {
  const [venue, setVenue] = useState<VenueData | null>(null);
  const [form, setForm] = useState<Partial<VenueData>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/venues/mine")
      .then((r) => r.json())
      .then((data) => {
        setVenue(data);
        setForm({
          name: data.name,
          type: data.type,
          address: data.address,
          city: data.city,
          state: data.state,
          zip: data.zip,
          phone: data.phone ?? "",
          website: data.website ?? "",
          description: data.description ?? "",
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);

    const res = await fetch("/api/venues/mine", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to save changes.");
    } else {
      const updated = await res.json();
      setVenue(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>Settings</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          Update your venue profile. Address changes will re-geocode your location.
        </p>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">
          ✓ Changes saved successfully
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Venue Identity */}
        <section
          className="rounded-2xl border p-6 mb-4 shadow-sm"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <h2 className="font-semibold flex items-center gap-2 mb-5" style={{ color: "var(--fg)" }}>
            <Building2 className="w-4 h-4 text-purple-600" />
            Venue identity
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>
                Venue name
              </label>
              <input
                type="text"
                value={form.name ?? ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className={inputCls}
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>
                Venue type
              </label>
              <select
                value={form.type ?? ""}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className={inputCls}
                style={inputStyle}
              >
                {VENUE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>
                Description
              </label>
              <textarea
                rows={4}
                value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className={`${inputCls} resize-none`}
                style={inputStyle}
              />
            </div>
          </div>
        </section>

        {/* Location */}
        <section
          className="rounded-2xl border p-6 mb-4 shadow-sm"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <h2 className="font-semibold flex items-center gap-2 mb-5" style={{ color: "var(--fg)" }}>
            <MapPin className="w-4 h-4 text-purple-600" />
            Location
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>
                Street address
              </label>
              <input
                type="text"
                value={form.address ?? ""}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                required
                className={inputCls}
                style={inputStyle}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>City</label>
                <input
                  type="text"
                  value={form.city ?? ""}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  required
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>State</label>
                <input
                  type="text"
                  value={form.state ?? ""}
                  onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })}
                  required
                  maxLength={2}
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>ZIP</label>
                <input
                  type="text"
                  value={form.zip ?? ""}
                  onChange={(e) => setForm({ ...form, zip: e.target.value })}
                  required
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
            </div>
            {venue && (
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                Current coordinates: {venue.lat.toFixed(4)}, {venue.lng.toFixed(4)} — will update on save if address changed.
              </p>
            )}
          </div>
        </section>

        {/* Contact */}
        <section
          className="rounded-2xl border p-6 mb-6 shadow-sm"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <h2 className="font-semibold flex items-center gap-2 mb-5" style={{ color: "var(--fg)" }}>
            <Phone className="w-4 h-4 text-purple-600" />
            Contact
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>Phone</label>
              <input
                type="tel"
                value={form.phone ?? ""}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="(415) 555-0100"
                className={inputCls}
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>Website</label>
              <input
                type="url"
                value={form.website ?? ""}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://yourvenue.com"
                className={inputCls}
                style={inputStyle}
              />
            </div>
          </div>
        </section>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-fuchsia-500 hover:opacity-90 active:scale-[0.98] transition-all shadow-md disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
