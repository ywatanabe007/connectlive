"use client";

interface StatusBadgeProps {
  startAt: string | Date;
  endAt: string | Date;
}

export function StatusBadge({ startAt, endAt }: StatusBadgeProps) {
  const now = new Date();
  const start = new Date(startAt);
  const end = new Date(endAt);
  const minsUntilStart = (start.getTime() - now.getTime()) / 60000;

  if (now >= start && now <= end) {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500 text-white whitespace-nowrap">
        ● LIVE
      </span>
    );
  }
  if (minsUntilStart <= 60 && minsUntilStart > 0) {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-400 text-white whitespace-nowrap">
        ● SOON
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-neutral-400 text-white whitespace-nowrap">
      ● LATER
    </span>
  );
}
