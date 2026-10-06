"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Zap, X, Trash2, Pencil, RefreshCw } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { INCENTIVE_CATEGORIES } from "@/lib/constants";

const RECURRENCE_OPTIONS = [
  { value: "ONE_TIME", label: "One-time" },
  { value: "DAILY",    label: "Daily" },
  { value: "WEEKLY",   label: "Weekly" },
  { value: "MONTHLY",  label: "Monthly" },
];

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type Incentive = {
  id: string;
  title: string;
  description: string;
  teaserText: string | null;
  category: string;
  validTimes: string | null;
  startAt: string;
  endAt: string;
  maxRedemptions: number | null;
  redemptionCount: number;
  status: string;
  groupFriendly: boolean;
  recurrence: string;
  terms: string | null;
};

const inputCls =
  "w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all";
const inputStyle = {
  background: "var(--bg)",
  borderColor: "var(--border)",
  color: "var(--fg)",
};

// Returns just the date portion YYYY-MM-DD from an ISO/datetime string
function toDateOnly(val: string | null | undefined): string {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

// Format a 24h "HH:MM" string to "h:MM AM/PM"
function formatTime12(t: string): string {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return t;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

// Build the validTimes string from days + times
function buildValidTimes(days: string[], startTime: string, endTime: string): string | null {
  if (days.length === 0 && !startTime && !endTime) return null;
  const dayStr = days.length > 0 ? days.join(", ") : "";
  const timeStr =
    startTime && endTime
      ? `${formatTime12(startTime)}–${formatTime12(endTime)}`
      : startTime
      ? `from ${formatTime12(startTime)}`
      : endTime
      ? `until ${formatTime12(endTime)}`
      : "";
  return [dayStr, timeStr].filter(Boolean).join(" ") || null;
}

// Try to parse days from an existing validTimes string (best-effort)
function parseDaysFromValidTimes(vt: string | null): string[] {
  if (!vt) return [];
  return DAYS_OF_WEEK.filter((d) => vt.includes(d));
}

type IncentiveFormState = {
  title: string;
  description: string;
  teaserText: string;
  category: string;
  selectedDays: string[];
  validStartTime: string;
  validEndTime: string;
  startAt: string;
  endAt: string;
  maxRedemptions: string;
  terms: string;
  groupFriendly: boolean;
  recurrence: string;
};

const EMPTY_FORM: IncentiveFormState = {
  title: "",
  description: "",
  teaserText: "",
  category: "",
  selectedDays: [],
  validStartTime: "",
  validEndTime: "",
  startAt: "",
  endAt: "",
  maxRedemptions: "",
  terms: "",
  groupFriendly: false,
  recurrence: "ONE_TIME",
};

function IncentiveModal({
  initial,
  onClose,
  onSaved,
}: {
  initial?: Incentive;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState<IncentiveFormState>(
    initial
      ? {
          title: initial.title,
          description: initial.description,
          teaserText: initial.teaserText ?? "",
          category: initial.category,
          selectedDays: parseDaysFromValidTimes(initial.validTimes),
          validStartTime: "",
          validEndTime: "",
          startAt: toDateOnly(initial.startAt),
          endAt: toDateOnly(initial.endAt),
          maxRedemptions: initial.maxRedemptions ? String(initial.maxRedemptions) : "",
          terms: initial.terms ?? "",
          groupFriendly: initial.groupFriendly,
          recurrence: initial.recurrence ?? "ONE_TIME",
        }
      : EMPTY_FORM
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggleDay(day: string) {
    setForm((prev) => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(day)
        ? prev.selectedDays.filter((d) => d !== day)
        : [...prev.selectedDays, day],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.teaserText.trim()) {
      setError("Teaser text is required.");
      return;
    }
    setLoading(true);
    setError("");

    const url = isEdit ? `/api/incentives/${initial!.id}` : "/api/incentives";
    const method = isEdit ? "PATCH" : "POST";

    const validTimes = buildValidTimes(form.selectedDays, form.validStartTime, form.validEndTime);

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        description: form.description,
        teaserText: form.teaserText.trim(),
        category: form.category,
        validTimes,
        startAt: form.startAt ? `${form.startAt}T00:00:00` : null,
        endAt: form.endAt ? `${form.endAt}T23:59:59` : null,
        maxRedemptions: form.maxRedemptions ? parseInt(form.maxRedemptions) : null,
        terms: form.terms || null,
        groupFriendly: form.groupFriendly,
        recurrence: form.recurrence,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Something went wrong.");
      setLoading(false);
      return;
    }

    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div
        className="w-full max-w-lg rounded-2xl border shadow-xl overflow-auto max-h-[90vh]"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <h2 className="font-bold text-lg" style={{ color: "var(--fg)" }}>
            {isEdit ? "Edit Incentive" : "New Incentive"}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:opacity-70 transition-opacity">
            <X className="w-5 h-5" style={{ color: "var(--muted)" }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              placeholder="Half-price appetizers 4–7pm"
              className={inputCls}
              style={inputStyle}
            />
          </div>

          {/* Teaser Text — required */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>
              Teaser text <span className="text-red-500">*</span>{" "}
              <span className="text-xs font-normal" style={{ color: "var(--muted)" }}>
                (short preview shown in app list)
              </span>
            </label>
            <input
              type="text"
              value={form.teaserText}
              onChange={(e) => setForm({ ...form, teaserText: e.target.value })}
              required
              placeholder="50% off apps during happy hour"
              maxLength={100}
              className={inputCls}
              style={inputStyle}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              placeholder="Show this offer to your server to redeem…"
              className={`${inputCls} resize-none`}
              style={inputStyle}
            />
          </div>

          {/* Category + Recurrence */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                required
                className={inputCls}
                style={inputStyle}
              >
                <option value="">Select…</option>
                {INCENTIVE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>
                Recurrence <span className="text-red-500">*</span>
              </label>
              <select
                value={form.recurrence}
                onChange={(e) => setForm({ ...form, recurrence: e.target.value })}
                required
                className={inputCls}
                style={inputStyle}
              >
                {RECURRENCE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Available Days */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--fg)" }}>
              Available days{" "}
              <span className="text-xs font-normal" style={{ color: "var(--muted)" }}>
                (optional)
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => {
                const active = form.selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
                    style={{
                      background: active ? "var(--purple-600, #9333ea)" : "var(--bg)",
                      borderColor: active ? "transparent" : "var(--border)",
                      color: active ? "#fff" : "var(--fg)",
                    }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Available Hours */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>
                Start time{" "}
                <span className="text-xs font-normal" style={{ color: "var(--muted)" }}>
                  (optional)
                </span>
              </label>
              <input
                type="time"
                value={form.validStartTime}
                onChange={(e) => setForm({ ...form, validStartTime: e.target.value })}
                className={inputCls}
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>
                End time{" "}
                <span className="text-xs font-normal" style={{ color: "var(--muted)" }}>
                  (optional)
                </span>
              </label>
              <input
                type="time"
                value={form.validEndTime}
                onChange={(e) => setForm({ ...form, validEndTime: e.target.value })}
                className={inputCls}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Preview of composed validTimes */}
          {(form.selectedDays.length > 0 || form.validStartTime || form.validEndTime) && (
            <div
              className="px-3 py-2 rounded-lg text-xs"
              style={{ background: "var(--border)", color: "var(--muted)" }}
            >
              <span className="font-medium">Valid times: </span>
              {buildValidTimes(form.selectedDays, form.validStartTime, form.validEndTime) ?? "—"}
            </div>
          )}

          {/* Campaign dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>
                Start date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.startAt}
                onChange={(e) => setForm({ ...form, startAt: e.target.value })}
                required
                className={inputCls}
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>
                End date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.endAt}
                onChange={(e) => setForm({ ...form, endAt: e.target.value })}
                required
                className={inputCls}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Max Redemptions */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>
              Max redemptions{" "}
              <span className="text-xs font-normal" style={{ color: "var(--muted)" }}>
                (leave blank for unlimited)
              </span>
            </label>
            <input
              type="number"
              min="1"
              value={form.maxRedemptions}
              onChange={(e) => setForm({ ...form, maxRedemptions: e.target.value })}
              placeholder="e.g. 50"
              className={inputCls}
              style={inputStyle}
            />
          </div>

          {/* Terms */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>
              Terms & conditions{" "}
              <span className="text-xs font-normal" style={{ color: "var(--muted)" }}>
                (optional)
              </span>
            </label>
            <textarea
              rows={2}
              value={form.terms}
              onChange={(e) => setForm({ ...form, terms: e.target.value })}
              placeholder="One per table, dine-in only…"
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
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl font-semibold border hover:opacity-80 transition-opacity"
              style={{ borderColor: "var(--border)", color: "var(--fg)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-fuchsia-500 hover:opacity-90 transition-all shadow-md disabled:opacity-50"
            >
              {loading ? (isEdit ? "Saving…" : "Creating…") : (isEdit ? "Save changes" : "Create Incentive")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const RECURRENCE_LABEL: Record<string, string> = {
  ONE_TIME: "One-time",
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
};

export default function IncentivesPage() {
  const [incentives, setIncentives] = useState<Incentive[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingIncentive, setEditingIncentive] = useState<Incentive | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchIncentives = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/incentives");
    if (res.ok) {
      const data = await res.json();
      setIncentives(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchIncentives(); }, [fetchIncentives]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this incentive? This cannot be undone.")) return;
    setDeletingId(id);
    await fetch(`/api/incentives/${id}`, { method: "DELETE" });
    setDeletingId(null);
    fetchIncentives();
  }

  async function handleToggleStatus(incentive: Incentive) {
    const newStatus = incentive.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    await fetch(`/api/incentives/${incentive.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchIncentives();
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>Incentives</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            Create offers that appear on the ConnectLive app
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-fuchsia-500 hover:opacity-90 active:scale-[0.98] transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          Add Incentive
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : incentives.length === 0 ? (
        <div
          className="rounded-2xl border border-dashed p-16 text-center"
          style={{ borderColor: "var(--border)" }}
        >
          <Zap className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: "var(--fg)" }} />
          <p className="font-semibold text-lg mb-1" style={{ color: "var(--fg)" }}>
            No incentives yet
          </p>
          <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>
            Create your first incentive to start attracting guests on the app
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-fuchsia-500 hover:opacity-90 transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            Create first incentive
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {incentives.map((incentive) => (
            <div
              key={incentive.id}
              onClick={() => setEditingIncentive(incentive)}
              className="rounded-2xl border p-5 flex items-start gap-4 shadow-sm cursor-pointer hover:border-purple-300 hover:shadow-md transition-all"
              style={{
                background: "var(--card)",
                borderColor: "var(--border)",
                opacity: incentive.status === "PAUSED" ? 0.65 : 1,
              }}
            >
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Zap className="w-5 h-5 text-purple-600" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 flex-wrap">
                  <p className="font-semibold" style={{ color: "var(--fg)" }}>
                    {incentive.title}
                  </p>
                  <StatusBadge startAt={incentive.startAt} endAt={incentive.endAt} />
                  {incentive.status === "PAUSED" && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-neutral-200 text-neutral-600">
                      PAUSED
                    </span>
                  )}
                  {incentive.groupFriendly && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                      Group friendly
                    </span>
                  )}
                  {incentive.recurrence && incentive.recurrence !== "ONE_TIME" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                      <RefreshCw className="w-3 h-3" />
                      {RECURRENCE_LABEL[incentive.recurrence] ?? incentive.recurrence}
                    </span>
                  )}
                </div>
                {incentive.teaserText && (
                  <p className="text-xs font-medium mt-0.5" style={{ color: "var(--muted)" }}>
                    {incentive.teaserText}
                  </p>
                )}
                <p className="text-sm mt-1 line-clamp-2" style={{ color: "var(--muted)" }}>
                  {incentive.description}
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs" style={{ color: "var(--muted)" }}>
                  <span className="px-2 py-0.5 rounded-full border" style={{ borderColor: "var(--border)" }}>
                    {incentive.category}
                  </span>
                  {incentive.validTimes && (
                    <span className="px-2 py-0.5 rounded-full border" style={{ borderColor: "var(--border)" }}>
                      🕐 {incentive.validTimes}
                    </span>
                  )}
                  <span>
                    {new Date(incentive.startAt).toLocaleDateString()} →{" "}
                    {new Date(incentive.endAt).toLocaleDateString()}
                  </span>
                  {incentive.maxRedemptions && (
                    <span>
                      {incentive.redemptionCount} / {incentive.maxRedemptions} redeemed
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setEditingIncentive(incentive)}
                  className="p-1.5 rounded-lg hover:bg-purple-50 hover:text-purple-600 transition-all"
                  style={{ color: "var(--muted)" }}
                  title="Edit"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleToggleStatus(incentive)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border hover:opacity-80 transition-opacity"
                  style={{ borderColor: "var(--border)", color: "var(--muted)" }}
                >
                  {incentive.status === "ACTIVE" ? "Pause" : "Resume"}
                </button>
                <button
                  onClick={() => handleDelete(incentive.id)}
                  disabled={deletingId === incentive.id}
                  className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-all disabled:opacity-50"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <IncentiveModal
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchIncentives(); }}
        />
      )}

      {editingIncentive && (
        <IncentiveModal
          initial={editingIncentive}
          onClose={() => setEditingIncentive(null)}
          onSaved={() => { setEditingIncentive(null); fetchIncentives(); }}
        />
      )}
    </div>
  );
}
