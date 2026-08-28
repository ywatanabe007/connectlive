"use client";

interface StatusBadgeProps {
  startAt: string | Date;
  endAt: string | Date;
}

export function StatusBadge({ startAt, endAt }: StatusBadgeProps) {
  const now = new Date();
  const start = new Date(startAt);
  const end = new Date(endAt);

  // Green — active right now
  if (now >= start && now <= end) {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500 text-white whitespace-nowrap">
        ● ACTIVE
      </span>
    );
  }

  // Orange — starts later today (same calendar day, hasn't started yet)
  const startIsToday =
    start > now &&
    start.getFullYear() === now.getFullYear() &&
    start.getMonth() === now.getMonth() &&
    start.getDate() === now.getDate();

  if (startIsToday) {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-400 text-white whitespace-nowrap">
        ● TODAY
      </span>
    );
  }

  // Grey — starts on a future date
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-neutral-400 text-white whitespace-nowrap">
      ● LATER
    </span>
  );
}
