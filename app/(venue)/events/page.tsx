"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Calendar, Trash2, X, Pencil, Clock, ExternalLink } from "lucide-react";
import { EXPERIENCE_CATEGORIES, BUSINESS_TYPES } from "@/lib/constants";

const EVENT_TYPES = [
  "Concert", "Comedy Night", "Happy Hour", "Live Music", "DJ Night",
  "Trivia Night", "Open Mic", "Sports Viewing", "Wine Tasting", "Food Festival",
  "Art Show", "Networking", "Private Event", "Holiday Event", "Other",
];

type Event = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  startTime: string;
  endTime: string | null;
  coverCharge: number | null;
  imageUrl: string | null;
  status: string;
  eventType: string | null;
  category: string | null;
  businessType: string | null;
  experienceCategory: string | null;
  timingRestrictions: string | null;
  groupFriendly: boolean;
  incentiveHint: string | null;
  incentiveDesc: string | null;
  eventUrl: string | null;
};

const inputCls =
  "w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all";
const inputStyle = {
  background: "var(--bg)",
  borderColor: "var(--border)",
  color: "var(--fg)",
};

type EventFormState = {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  coverCharge: string;
  imageUrl: string;
  eventType: string;
  category: string;
  businessType: string;
  experienceCategory: string;
  timingRestrictions: string;
  groupFriendly: boolean;
  incentiveHint: string;
  incentiveDesc: string;
  eventUrl: string;
};

const EMPTY_FORM: EventFormState = {
  title: "",
  description: "",
  date: "",
  startTime: "",
  endTime: "",
  coverCharge: "",
  imageUrl: "",
  eventType: "",
  category: "",
  businessType: "",
  experienceCategory: "",
  timingRestrictions: "",
  groupFriendly: false,
  incentiveHint: "",
  incentiveDesc: "",
  eventUrl: "",
};

function EventModal({
  initial,
  onClose,
  onSaved,
}: {
  initial?: Event;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState<EventFormState>(
    initial
      ? {
          title: initial.title,
          description: initial.description ?? "",
          date: initial.date ? initial.date.slice(0, 10) : "",
          startTime: initial.startTime ?? "",
          endTime: initial.endTime ?? "",
          coverCharge: initial.coverCharge != null ? String(initial.coverCharge) : "",
          imageUrl: initial.imageUrl ?? "",
          eventType: initial.eventType ?? "",
          category: initial.category ?? "",
          businessType: initial.businessType ?? "",
          experienceCategory: initial.experienceCategory ?? "",
          timingRestrictions: initial.timingRestrictions ?? "",
          groupFriendly: initial.groupFriendly ?? false,
          incentiveHint: initial.incentiveHint ?? "",
          incentiveDesc: initial.incentiveDesc ?? "",
          eventUrl: initial.eventUrl ?? "",
        }
      : EMPTY_FORM
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof EventFormState>(field: K, value: EventFormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.date || !form.startTime) {
      setError("Title, date, and start time are required.");
      return;
    }
    setLoading(true);
    setError("");

    const payload = {
      ...form,
      coverCharge: form.coverCharge !== "" ? parseFloat(form.coverCharge) : null,
      groupFriendly: form.groupFriendly,
    };

    const res = await fetch(isEdit ? `/api/events/${initial!.id}` : "/api/events", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to save event.");
      setLoading(false);
      return;
    }

    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div
        className="w-full max-w-2xl rounded-2xl border shadow-xl overflow-y-auto"
        style={{ background: "var(--card)", borderColor: "var(--border)", maxHeight: "90vh" }}
      >
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-lg font-bold" style={{ color: "var(--fg)" }}>
            {isEdit ? "Edit Event" : "Add Event"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
            <X className="w-5 h-5" style={{ color: "var(--muted)" }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>
              Event title <span className="text-red-500">*</span>
            </label>
            <input type="text" value={form.title} onChange={(e) => set("title", e.target.value)}
              placeholder="Live Jazz Night" className={inputCls} style={inputStyle} />
          </div>

          {/* Event Type + Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>Event type</label>
              <select value={form.eventType} onChange={(e) => set("eventType", e.target.value)} className={inputCls} style={inputStyle}>
                <option value="">Select type…</option>
                {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>Category</label>
              <select value={form.category} onChange={(e) => set("category", e.target.value)} className={inputCls} style={inputStyle}>
                <option value="">Select category…</option>
                {EXPERIENCE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Date + Times */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>
                Date <span className="text-red-500">*</span>
              </label>
              <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)}
                className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>
                Start time <span className="text-red-500">*</span>
              </label>
              <input type="time" value={form.startTime} onChange={(e) => set("startTime", e.target.value)}
                className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>End time</label>
              <input type="time" value={form.endTime} onChange={(e) => set("endTime", e.target.value)}
                className={inputCls} style={inputStyle} />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)}
              placeholder="Tell guests what to expect…"
              className={`${inputCls} resize-none`} style={inputStyle} />
          </div>

          {/* Incentive Hint + Desc */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>
                Incentive hint <span className="text-xs font-normal" style={{ color: "var(--muted)" }}>(short teaser)</span>
              </label>
              <input type="text" value={form.incentiveHint} onChange={(e) => set("incentiveHint", e.target.value)}
                placeholder="Free drink with entry" className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>
                Incentive description <span className="text-xs font-normal" style={{ color: "var(--muted)" }}>(full details)</span>
              </label>
              <input type="text" value={form.incentiveDesc} onChange={(e) => set("incentiveDesc", e.target.value)}
                placeholder="One complimentary drink at the bar" className={inputCls} style={inputStyle} />
            </div>
          </div>

          {/* Timing Restrictions */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>Timing restrictions</label>
            <input type="text" value={form.timingRestrictions} onChange={(e) => set("timingRestrictions", e.target.value)}
              placeholder="e.g. Doors open at 7pm, show starts 8pm" className={inputCls} style={inputStyle} />
          </div>

          {/* Business Type + Experience Category (optional overrides) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>
                Business type <span className="text-xs font-normal" style={{ color: "var(--muted)" }}>(optional)</span>
              </label>
              <select value={form.businessType} onChange={(e) => set("businessType", e.target.value)} className={inputCls} style={inputStyle}>
                <option value="">Use venue default…</option>
                {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>
                Experience category <span className="text-xs font-normal" style={{ color: "var(--muted)" }}>(optional)</span>
              </label>
              <select value={form.experienceCategory} onChange={(e) => set("experienceCategory", e.target.value)} className={inputCls} style={inputStyle}>
                <option value="">Use venue default…</option>
                {EXPERIENCE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Cover Charge + Event URL */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>Cover charge ($)</label>
              <input type="number" min="0" step="0.01" value={form.coverCharge}
                onChange={(e) => set("coverCharge", e.target.value)}
                placeholder="0 for free" className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>Event URL</label>
              <input type="url" value={form.eventUrl} onChange={(e) => set("eventUrl", e.target.value)}
                placeholder="https://tickets.example.com" className={inputCls} style={inputStyle} />
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>Event image URL</label>
            <input type="url" value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)}
              placeholder="https://example.com/event-photo.jpg" className={inputCls} style={inputStyle} />
          </div>

          {/* Group Friendly */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => set("groupFriendly", !form.groupFriendly)}
              className={`w-11 h-6 rounded-full transition-colors relative ${form.groupFriendly ? "bg-purple-600" : "bg-neutral-300"}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.groupFriendly ? "translate-x-5.5" : "translate-x-0.5"}`} />
            </div>
            <span className="text-sm font-medium" style={{ color: "var(--fg)" }}>Group friendly</span>
          </label>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl font-semibold border hover:opacity-80 transition-opacity"
              style={{ borderColor: "var(--border)", color: "var(--fg)" }}>
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-fuchsia-500 hover:opacity-90 transition-all shadow-md disabled:opacity-50">
              {loading ? "Saving…" : isEdit ? "Save changes" : "Add event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/events");
    if (res.ok) setEvents(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this event?")) return;
    setDeletingId(id);
    await fetch(`/api/events/${id}`, { method: "DELETE" });
    setDeletingId(null);
    fetchEvents();
  }

  function formatDate(date: string, startTime: string, endTime?: string | null) {
    const d = new Date(date);
    const dateStr = d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    const time = endTime ? `${startTime} – ${endTime}` : startTime;
    return `${dateStr} · ${time}`;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>Events</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            Events appear in the Partner Events section of the ConnectLive app
          </p>
        </div>
        <button
          onClick={() => { setEditingEvent(undefined); setShowModal(true); }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-fuchsia-500 hover:opacity-90 active:scale-[0.98] transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          Add Event
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-16 text-center" style={{ borderColor: "var(--border)" }}>
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: "var(--fg)" }} />
          <p className="font-semibold text-lg mb-1" style={{ color: "var(--fg)" }}>No events yet</p>
          <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>
            Add your first event to have it appear in the ConnectLive app
          </p>
          <button
            onClick={() => { setEditingEvent(undefined); setShowModal(true); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-fuchsia-500 hover:opacity-90 transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            Add first event
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              onClick={() => { setEditingEvent(event); setShowModal(true); }}
              className="rounded-2xl border p-5 flex items-start gap-4 shadow-sm cursor-pointer hover:border-purple-300 hover:shadow-md transition-all"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 flex-wrap">
                  <p className="font-semibold" style={{ color: "var(--fg)" }}>{event.title}</p>
                  {event.eventType && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                      {event.eventType}
                    </span>
                  )}
                  {event.groupFriendly && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600">
                      Group friendly
                    </span>
                  )}
                  {event.status === "CANCELLED" && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-600">
                      Cancelled
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: "var(--muted)" }}>
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(event.date, event.startTime, event.endTime)}</span>
                </div>

                {event.incentiveHint && (
                  <p className="text-xs font-medium mt-1" style={{ color: "var(--muted)" }}>
                    🎁 {event.incentiveHint}
                  </p>
                )}

                {event.description && (
                  <p className="text-sm mt-1 line-clamp-2" style={{ color: "var(--muted)" }}>
                    {event.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs" style={{ color: "var(--muted)" }}>
                  {event.category && (
                    <span className="px-2 py-0.5 rounded-full border" style={{ borderColor: "var(--border)" }}>
                      {event.category}
                    </span>
                  )}
                  {event.coverCharge != null && (
                    <span>${event.coverCharge === 0 ? "Free" : event.coverCharge}</span>
                  )}
                  {event.timingRestrictions && <span>🕐 {event.timingRestrictions}</span>}
                  {event.eventUrl && (
                    <a href={event.eventUrl} target="_blank" rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-purple-600 hover:underline">
                      <ExternalLink className="w-3 h-3" /> Link
                    </a>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => { setEditingEvent(event); setShowModal(true); }}
                  className="p-1.5 rounded-lg hover:bg-purple-50 hover:text-purple-600 transition-all"
                  style={{ color: "var(--muted)" }}
                  title="Edit"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(event.id)}
                  disabled={deletingId === event.id}
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
        <EventModal
          initial={editingEvent}
          onClose={() => { setShowModal(false); setEditingEvent(undefined); }}
          onSaved={() => { setShowModal(false); setEditingEvent(undefined); fetchEvents(); }}
        />
      )}
    </div>
  );
}
