"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Zap, X, Trash2, Pencil } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";

const CATEGORIES = ["Happy Hour", "Food Deal", "Drink Special", "Entertainment", "Other"];

type Incentive = {
  id: string;
  title: string;
  description: string;
  category: string;
  startAt: string;
  endAt: string;
  maxRedemptions: number | null;
  redemptionCount: number;
  status: string;
  terms: string | null;
};

const inputCls =
  "w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all";
const inputStyle = {
  background: "var(--bg)",
  borderColor: "var(--border)",
  color: "var(--fg)",
};

function IncentiveModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    startAt: "",
    endAt: "",
    maxRedemptions: "",
    terms: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/incentives", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        maxRedemptions: form.maxRedemptions ? parseInt(form.maxRedemptions) : null,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to create incentive.");
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
            New Incentive
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
              <option value="">Select category…</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>
                Start date & time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={form.startAt}
                onChange={(e) => setForm({ ...form, startAt: e.target.value })}
                required
                className={inputCls}
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>
                End date & time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={form.endAt}
                onChange={(e) => setForm({ ...form, endAt: e.target.value })}
                required
                className={inputCls}
                style={inputStyle}
              />
            </div>
          </div>

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
              {loading ? "Creating…" : "Create Incentive"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function IncentivesPage() {
  const router = useRouter();
  const [incentives, setIncentives] = useState<Incentive[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
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
              className="rounded-2xl border p-5 flex items-start gap-4 shadow-sm"
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
                </div>
                <p className="text-sm mt-1 line-clamp-2" style={{ color: "var(--muted)" }}>
                  {incentive.description}
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs" style={{ color: "var(--muted)" }}>
                  <span className="px-2 py-0.5 rounded-full border" style={{ borderColor: "var(--border)" }}>
                    {incentive.category}
                  </span>
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

              <div className="flex items-center gap-2 flex-shrink-0">
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
    </div>
  );
}
