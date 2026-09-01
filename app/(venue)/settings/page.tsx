"use client";

import { useState, useEffect } from "react";
import { Save, Building2, MapPin, Phone, Clock, Image, Upload, X } from "lucide-react";
import {
  BUSINESS_TYPES,
  EXPERIENCE_CATEGORIES,
  US_TIMEZONES,
  DAYS_OF_WEEK,
  DEFAULT_BUSINESS_HOURS,
  type BusinessHours,
  type DayOfWeek,
} from "@/lib/constants";

type VenueData = {
  id: string;
  name: string;
  type: string;
  businessType: string | null;
  experienceCategory: string | null;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string | null;
  website: string | null;
  imageUrl: string | null;
  description: string | null;
  groupFriendly: boolean;
  timeZone: string | null;
  businessHours: BusinessHours | null;
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
  const [hours, setHours] = useState<BusinessHours>(DEFAULT_BUSINESS_HOURS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    fetch("/api/venues/mine")
      .then((r) => r.json())
      .then((data) => {
        setVenue(data);
        setForm({
          name: data.name,
          type: data.type,
          businessType: data.businessType ?? "",
          experienceCategory: data.experienceCategory ?? "",
          address: data.address,
          city: data.city,
          state: data.state,
          zip: data.zip,
          phone: data.phone ?? "",
          website: data.website ?? "",
          imageUrl: data.imageUrl ?? "",
          description: data.description ?? "",
          groupFriendly: data.groupFriendly ?? false,
          timeZone: data.timeZone ?? "",
        });
        if (data.businessHours) {
          setHours(data.businessHours as BusinessHours);
        }
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
      body: JSON.stringify({ ...form, businessHours: hours }),
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

  async function processImageFile(file: File) {
    setUploadError("");

    // Format check
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setUploadError("Please upload a JPEG, PNG, or WebP image.");
      return;
    }

    // Size check (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be 5 MB or smaller.");
      return;
    }

    // Aspect ratio check (1.04:1 ± 5%)
    const ratio = await new Promise<number>((resolve) => {
      const img = new window.Image();
      img.onload = () => resolve(img.width / img.height);
      img.src = URL.createObjectURL(file);
    });
    const target = 1.04;
    const tolerance = 0.05;
    if (Math.abs(ratio - target) > tolerance) {
      setUploadError(
        `Image ratio must be approximately 1.04:1 (yours is ${ratio.toFixed(2)}:1). ` +
        `Try cropping to roughly 1040 × 1000 px.`
      );
      return;
    }

    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok) {
      setForm((prev) => ({ ...prev, imageUrl: data.url }));
    } else {
      setUploadError(data.error ?? "Upload failed");
    }
    setUploading(false);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await processImageFile(file);
    e.target.value = "";
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || uploading) return;
    await processImageFile(file);
  }

  function updateHours(day: DayOfWeek, field: "open" | "close" | "closed", value: string | boolean) {
    setHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>
                  Business type
                </label>
                <select
                  value={form.businessType ?? ""}
                  onChange={(e) => setForm({ ...form, businessType: e.target.value })}
                  className={inputCls}
                  style={inputStyle}
                >
                  <option value="">Select type…</option>
                  {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>
                  Experience category
                </label>
                <select
                  value={form.experienceCategory ?? ""}
                  onChange={(e) => setForm({ ...form, experienceCategory: e.target.value })}
                  className={inputCls}
                  style={inputStyle}
                >
                  <option value="">Select category…</option>
                  {EXPERIENCE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
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

            {/* Group Friendly */}
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div
                onClick={() => setForm({ ...form, groupFriendly: !form.groupFriendly })}
                className={`relative w-10 h-6 rounded-full transition-colors ${form.groupFriendly ? "bg-purple-600" : "bg-gray-300"}`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.groupFriendly ? "translate-x-4" : ""}`}
                />
              </div>
              <span className="text-sm font-medium" style={{ color: "var(--fg)" }}>Group friendly</span>
              <span className="text-xs" style={{ color: "var(--muted)" }}>Available for group bookings in the app</span>
            </label>
          </div>
        </section>

        {/* Image */}
        <section
          className="rounded-2xl border p-6 mb-4 shadow-sm"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <h2 className="font-semibold flex items-center gap-2 mb-5" style={{ color: "var(--fg)" }}>
            <Image className="w-4 h-4 text-purple-600" />
            Venue image
          </h2>

          {/* Current image preview */}
          {form.imageUrl && (
            <div className="mb-4 rounded-xl overflow-hidden border relative group" style={{ borderColor: "var(--border)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.imageUrl} alt="Venue" className="w-full h-48 object-cover" />
              <button
                type="button"
                onClick={() => setForm({ ...form, imageUrl: "" })}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Upload dropzone */}
          <label
            className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${uploading ? "opacity-60 cursor-wait" : isDragging ? "border-purple-500 bg-purple-50/30" : "hover:border-purple-400 hover:bg-purple-50/20"}`}
            style={{ borderColor: isDragging ? undefined : "var(--border)" }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center gap-1.5 pointer-events-none">
              {uploading ? (
                <>
                  <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm font-medium text-purple-600">Uploading…</span>
                </>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-purple-500" />
                  <span className="text-sm font-medium text-purple-600">
                    {form.imageUrl ? "Replace image" : "Upload venue image"}
                  </span>
                  <span className="text-xs" style={{ color: "var(--muted)" }}>JPEG preferred · PNG or WebP ok · max 5 MB · ratio 1.04:1</span>
                </>
              )}
            </div>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleImageUpload}
              disabled={uploading}
            />
          </label>

          {uploadError && (
            <p className="mt-2 text-sm text-red-600">{uploadError}</p>
          )}
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
          className="rounded-2xl border p-6 mb-4 shadow-sm"
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

        {/* Business Hours */}
        <section
          className="rounded-2xl border p-6 mb-4 shadow-sm"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <h2 className="font-semibold flex items-center gap-2 mb-2" style={{ color: "var(--fg)" }}>
            <Clock className="w-4 h-4 text-purple-600" />
            Business hours
          </h2>

          {/* Time Zone */}
          <div className="mb-5">
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>Time zone</label>
            <select
              value={form.timeZone ?? ""}
              onChange={(e) => setForm({ ...form, timeZone: e.target.value })}
              className={inputCls}
              style={inputStyle}
            >
              <option value="">Select time zone…</option>
              {US_TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            {/* Header row */}
            <div className="grid gap-3 text-xs font-medium pb-1" style={{ gridTemplateColumns: "90px 1fr 1fr 80px", color: "var(--muted)" }}>
              <span>Day</span>
              <span>Opens</span>
              <span>Closes</span>
              <span>Closed</span>
            </div>
            {DAYS_OF_WEEK.map((day) => {
              const dayHours = hours[day];
              return (
                <div key={day} className="grid gap-3 items-center" style={{ gridTemplateColumns: "90px 1fr 1fr 80px" }}>
                  <span className="text-sm capitalize font-medium" style={{ color: "var(--fg)" }}>
                    {day.slice(0, 3).charAt(0).toUpperCase() + day.slice(1, 3)}
                  </span>
                  <input
                    type="time"
                    value={dayHours.open}
                    disabled={dayHours.closed}
                    onChange={(e) => updateHours(day, "open", e.target.value)}
                    className={`${inputCls} disabled:opacity-40`}
                    style={inputStyle}
                  />
                  <input
                    type="time"
                    value={dayHours.close}
                    disabled={dayHours.closed}
                    onChange={(e) => updateHours(day, "close", e.target.value)}
                    className={`${inputCls} disabled:opacity-40`}
                    style={inputStyle}
                  />
                  <label className="flex items-center gap-2 justify-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dayHours.closed}
                      onChange={(e) => updateHours(day, "closed", e.target.checked)}
                      className="w-4 h-4 accent-purple-600"
                    />
                    <span className="text-xs" style={{ color: "var(--muted)" }}>Closed</span>
                  </label>
                </div>
              );
            })}
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
