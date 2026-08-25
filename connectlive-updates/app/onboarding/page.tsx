"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Building2, FileText, CheckCircle2, MapPin, Clock } from "lucide-react";
import {
  BUSINESS_TYPES,
  EXPERIENCE_CATEGORIES,
  US_TIMEZONES,
  DEFAULT_BUSINESS_HOURS,
  DAYS_OF_WEEK,
  type BusinessHours,
} from "@/lib/constants";

type Step1 = {
  name: string;
  businessType: string;
  experienceCategory: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  website: string;
  imageUrl: string;
  timeZone: string;
  groupFriendly: boolean;
};

type Step2 = {
  description: string;
  unique: string;
};

const inputCls =
  "w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all";

const inputStyle = {
  background: "var(--bg)",
  borderColor: "var(--border)",
  color: "var(--fg)",
};

export default function OnboardingPage() {
  const router = useRouter();
  const session = useSession();
  const update = session?.update;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [step1, setStep1] = useState<Step1>({
    name: "",
    businessType: "",
    experienceCategory: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
    website: "",
    imageUrl: "",
    timeZone: "",
    groupFriendly: false,
  });

  const [step2, setStep2] = useState<Step2>({ description: "", unique: "" });
  const [businessHours, setBusinessHours] = useState<BusinessHours>(DEFAULT_BUSINESS_HOURS);

  function updateStep1<K extends keyof Step1>(field: K, value: Step1[K]) {
    setStep1((prev) => ({ ...prev, [field]: value }));
  }

  function updateHours(day: keyof BusinessHours, field: "open" | "close" | "closed", value: string | boolean) {
    setBusinessHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  }

  function validateStep1() {
    if (!step1.name.trim()) return "Venue name is required.";
    if (!step1.businessType) return "Business type is required.";
    if (!step1.experienceCategory) return "Experience category is required.";
    if (!step1.address.trim()) return "Street address is required.";
    if (!step1.city.trim()) return "City is required.";
    if (!step1.state.trim()) return "State is required.";
    if (!step1.zip.trim()) return "ZIP code is required.";
    return null;
  }

  function validateStep2() {
    if (!step2.description.trim()) return "Description is required.";
    return null;
  }

  async function handleFinish() {
    setLoading(true);
    setError("");

    const description = step2.unique
      ? `${step2.description}\n\nWhat makes us unique: ${step2.unique}`
      : step2.description;

    const res = await fetch("/api/venues/mine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...step1,
        description,
        businessHours,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to create venue. Please try again.");
      setLoading(false);
      return;
    }

    await update?.();
    router.push("/dashboard");
    router.refresh();
  }

  const stepLabels = ["Venue details", "About & hours", "Confirm"];

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <img src="/logo.png" alt="ConnectLive" className="w-10 h-10 object-contain" />
            <span className="text-xl font-bold" style={{ color: "var(--fg)" }}>ConnectLive</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>Set up your venue</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            Just a few details to get you live on the app
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-0 mb-8">
          {stepLabels.map((label, i) => {
            const s = i + 1;
            const done = s < step;
            const active = s === step;
            return (
              <div key={s} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      done
                        ? "bg-emerald-500 text-white"
                        : active
                        ? "bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white shadow-md"
                        : "border-2 text-neutral-400"
                    }`}
                    style={{ borderColor: !done && !active ? "var(--border)" : undefined }}
                  >
                    {done ? <CheckCircle2 className="w-5 h-5" /> : s}
                  </div>
                  <span className="text-xs mt-1 font-medium" style={{ color: active ? "var(--fg)" : "var(--muted)" }}>
                    {label}
                  </span>
                </div>
                {s < 3 && (
                  <div className={`w-16 h-0.5 mb-4 mx-2 ${done ? "bg-emerald-400" : "bg-neutral-200"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8 border shadow-sm"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* ── Step 1: Venue details ── */}
          {step === 1 && (
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-6" style={{ color: "var(--fg)" }}>
                <Building2 className="w-5 h-5 text-purple-600" />
                Venue details
              </h2>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>
                    Venue name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={step1.name}
                    onChange={(e) => updateStep1("name", e.target.value)}
                    placeholder="The Blue Moon Bar"
                    className={inputCls}
                    style={inputStyle}
                  />
                </div>

                {/* Business Type + Experience Category */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>
                      Business type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={step1.businessType}
                      onChange={(e) => updateStep1("businessType", e.target.value)}
                      className={inputCls}
                      style={inputStyle}
                    >
                      <option value="">Select type…</option>
                      {BUSINESS_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>
                      Experience category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={step1.experienceCategory}
                      onChange={(e) => updateStep1("experienceCategory", e.target.value)}
                      className={inputCls}
                      style={inputStyle}
                    >
                      <option value="">Select category…</option>
                      {EXPERIENCE_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>
                    Street address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={step1.address}
                    onChange={(e) => updateStep1("address", e.target.value)}
                    placeholder="123 Main St"
                    className={inputCls}
                    style={inputStyle}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={step1.city}
                      onChange={(e) => updateStep1("city", e.target.value)}
                      placeholder="San Francisco"
                      className={inputCls}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>
                      State <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={step1.state}
                      onChange={(e) => updateStep1("state", e.target.value.toUpperCase())}
                      placeholder="CA"
                      maxLength={2}
                      className={inputCls}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>
                      ZIP <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={step1.zip}
                      onChange={(e) => updateStep1("zip", e.target.value)}
                      placeholder="94102"
                      maxLength={10}
                      className={inputCls}
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Phone + Website */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>Phone</label>
                    <input
                      type="tel"
                      value={step1.phone}
                      onChange={(e) => updateStep1("phone", e.target.value)}
                      placeholder="(415) 555-0100"
                      className={inputCls}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>Website URL</label>
                    <input
                      type="url"
                      value={step1.website}
                      onChange={(e) => updateStep1("website", e.target.value)}
                      placeholder="https://yourvenue.com"
                      className={inputCls}
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>Venue image URL</label>
                  <input
                    type="url"
                    value={step1.imageUrl}
                    onChange={(e) => updateStep1("imageUrl", e.target.value)}
                    placeholder="https://example.com/venue-photo.jpg"
                    className={inputCls}
                    style={inputStyle}
                  />
                </div>

                {/* Timezone + Group Friendly */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>Time zone</label>
                    <select
                      value={step1.timeZone}
                      onChange={(e) => updateStep1("timeZone", e.target.value)}
                      className={inputCls}
                      style={inputStyle}
                    >
                      <option value="">Select time zone…</option>
                      {US_TIMEZONES.map((tz) => (
                        <option key={tz.value} value={tz.value}>{tz.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col justify-end">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div
                        onClick={() => updateStep1("groupFriendly", !step1.groupFriendly)}
                        className={`w-11 h-6 rounded-full transition-colors relative ${step1.groupFriendly ? "bg-purple-600" : "bg-neutral-300"}`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${step1.groupFriendly ? "translate-x-5.5" : "translate-x-0.5"}`} />
                      </div>
                      <span className="text-sm font-medium" style={{ color: "var(--fg)" }}>Group friendly</span>
                    </label>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  const err = validateStep1();
                  if (err) { setError(err); return; }
                  setError("");
                  setStep(2);
                }}
                className="w-full mt-6 py-2.5 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-fuchsia-500 hover:opacity-90 active:scale-[0.98] transition-all shadow-md"
              >
                Continue →
              </button>
            </div>
          )}

          {/* ── Step 2: About & Hours ── */}
          {step === 2 && (
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-6" style={{ color: "var(--fg)" }}>
                <FileText className="w-5 h-5 text-purple-600" />
                About your venue
              </h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={step2.description}
                    onChange={(e) => setStep2({ ...step2, description: e.target.value })}
                    placeholder="Describe your venue — the atmosphere, cuisine, entertainment…"
                    className={`${inputCls} resize-none`}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>What makes your venue unique?</label>
                  <textarea
                    rows={2}
                    value={step2.unique}
                    onChange={(e) => setStep2({ ...step2, unique: e.target.value })}
                    placeholder="Award-winning cocktails, live jazz every Friday…"
                    className={`${inputCls} resize-none`}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Business Hours */}
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3" style={{ color: "var(--fg)" }}>
                <Clock className="w-4 h-4 text-purple-600" />
                Business hours
              </h3>
              <div className="space-y-2 mb-6">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day} className="flex items-center gap-3">
                    <span className="w-24 text-sm capitalize font-medium" style={{ color: "var(--fg)" }}>{day}</span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!businessHours[day].closed}
                        onChange={(e) => updateHours(day, "closed", !e.target.checked)}
                        className="accent-purple-600"
                      />
                      <span className="text-xs" style={{ color: "var(--muted)" }}>Open</span>
                    </label>
                    {!businessHours[day].closed && (
                      <>
                        <input
                          type="time"
                          value={businessHours[day].open}
                          onChange={(e) => updateHours(day, "open", e.target.value)}
                          className="px-2 py-1 rounded-lg border text-xs"
                          style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }}
                        />
                        <span className="text-xs" style={{ color: "var(--muted)" }}>to</span>
                        <input
                          type="time"
                          value={businessHours[day].close}
                          onChange={(e) => updateHours(day, "close", e.target.value)}
                          className="px-2 py-1 rounded-lg border text-xs"
                          style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }}
                        />
                      </>
                    )}
                    {businessHours[day].closed && (
                      <span className="text-xs" style={{ color: "var(--muted)" }}>Closed</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setError(""); setStep(1); }}
                  className="flex-1 py-2.5 px-4 rounded-xl font-semibold border hover:opacity-80 transition-opacity"
                  style={{ borderColor: "var(--border)", color: "var(--fg)" }}
                >
                  ← Back
                </button>
                <button
                  onClick={() => {
                    const err = validateStep2();
                    if (err) { setError(err); return; }
                    setError("");
                    setStep(3);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-fuchsia-500 hover:opacity-90 active:scale-[0.98] transition-all shadow-md"
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Confirm ── */}
          {step === 3 && (
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-6" style={{ color: "var(--fg)" }}>
                <MapPin className="w-5 h-5 text-purple-600" />
                Confirm your details
              </h2>

              <div
                className="rounded-xl p-5 border space-y-3 mb-5"
                style={{ background: "var(--bg)", borderColor: "var(--border)" }}
              >
                <div>
                  <p className="font-bold text-lg" style={{ color: "var(--fg)" }}>{step1.name}</p>
                  <p className="text-sm" style={{ color: "var(--muted)" }}>{step1.businessType} · {step1.experienceCategory}</p>
                </div>
                <div className="text-sm" style={{ color: "var(--muted)" }}>
                  {step1.address}<br />
                  {step1.city}, {step1.state} {step1.zip}
                </div>
                {step1.phone && <p className="text-sm" style={{ color: "var(--muted)" }}>{step1.phone}</p>}
                {step1.website && <p className="text-sm text-purple-600 break-all">{step1.website}</p>}
                {step1.timeZone && <p className="text-sm" style={{ color: "var(--muted)" }}>🕐 {step1.timeZone}</p>}
                {step1.groupFriendly && <p className="text-sm text-emerald-600 font-medium">✓ Group friendly</p>}
                <div className="pt-3 border-t text-sm" style={{ borderColor: "var(--border)", color: "var(--fg)" }}>
                  {step2.description}
                </div>
              </div>

              <p className="text-xs mb-6" style={{ color: "var(--muted)" }}>
                We&apos;ll geocode your address so guests can find you on the map. You can update all details anytime from Settings.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => { setError(""); setStep(2); }}
                  className="flex-1 py-2.5 px-4 rounded-xl font-semibold border hover:opacity-80 transition-opacity"
                  style={{ borderColor: "var(--border)", color: "var(--fg)" }}
                >
                  ← Back
                </button>
                <button
                  onClick={handleFinish}
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-fuchsia-500 hover:opacity-90 active:scale-[0.98] transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Setting up…" : "🚀 Launch my portal"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
