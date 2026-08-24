"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Calendar, Trash2, X, Clock, DollarSign } from "lucide-react";

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
};

const inputCls =
  "w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all";
const inputStyle = {
  background: "var(--bg)",
  borderColor: "var(--border)",
  color: "var(--fg)",
};

function EventModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    coverCharge: "",
    imageUrl: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        coverCharge: form.coverCharge !== "" ? parseFloat(form.coverCharge) : null,
        description: form.description || null,
        endTime: form.endTime || null,
        imageUrl: form.imageUrl || null,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to create event.");
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
            New Event
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
              Event title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              placeholder="Jazz Night with The Blue Quartet"
              className={inputCls}
              style={inputStyle}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>
              Description
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="An unforgettable evening of live jazz…"
              className={`${inputCls} resize-none`}
              style={inputStyle}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
              className={inputCls}
              style={inputStyle}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>
                Start time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                required
                className={inputCls}
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>
                End time
              </label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className={inputCls}
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>
              Cover charge ($){" "}
              <span className="text-xs font-normal" style={{ color: "var(--muted)" }}>
                (leave blank or 0 for free)
              </span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.coverCharge}
              onChange={(e) => setForm({ ...form, coverCharge: e.target.value })}
              placeholder="0"
              className={inputCls}
              style={inputStyle}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>
              Event image URL{" "}
              <span className="text-xs font-normal" style={{ color: "var(--muted)" }}>
                (optional)
              </span>
            </label>
            <input
              type="url"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="https://…"
              className={inputCls}
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
              {loading ? "Creating…" : "Create Event"}
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
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/events");
    if (res.ok) setEvents(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this event? This cannot be undone.")) return;
    setDeletingId(id);
    await fetch(`/api/events/${id}`, { method: "DELETE" });
    setDeletingId(null);
    fetchEvents();
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  const statusColor: Record<string, string> = {
    UPCOMING: "bg-blue-100 text-blue-700",
    LIVE: "bg-emerald-100 text-emerald-700",
    ENDED: "bg-neutral-100 text-neutral-600",
    CANCELLED: "bg-red-100 text-red-600",
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>Events</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            Promote your upcoming shows, nights, and experiences
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
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
        <div
          className="rounded-2xl border border-dashed p-16 text-center"
          style={{ borderColor: "var(--border)" }}
        >
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: "var(--fg)" }} />
          <p className="font-semibold text-lg mb-1" style={{ color: "var(--fg)" }}>
            No events yet
          </p>
          <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>
            Add events to let guests discover what&apos;s happening at your venue
          </p>
          <button
            onClick={() => setShowModal(true)}
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
              className="rounded-2xl border p-5 flex items-start gap-4 shadow-sm"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex flex-col items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-amber-700 uppercase leading-none">
                  {new Date(event.date).toLocaleDateString("en-US", { month: "short" })}
                </span>
                <span className="text-lg font-bold text-amber-700 leading-tight">
                  {new Date(event.date).getDate()}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 flex-wrap">
                  <p className="font-semibold" style={{ color: "var(--fg)" }}>{event.title}</p>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor[event.status] ?? "bg-neutral-100 text-neutral-600"}`}
                  >
                    {event.status}
                  </span>
                </div>

                {event.description && (
                  <p className="text-sm mt-1 line-clamp-2" style={{ color: "var(--muted)" }}>
                    {event.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs" style={{ color: "var(--muted)" }}>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(event.date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {event.startTime}
                    {event.endTime ? ` – ${event.endTime}` : ""}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    {event.coverCharge && event.coverCharge > 0
                      ? `$${event.coverCharge} cover`
                      : "Free entry"}
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleDelete(event.id)}
                disabled={deletingId === event.id}
                className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-all disabled:opacity-50 flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <EventModal
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchEvents(); }}
        />
      )}
    </div>
  );
}
