"use client";

import { EXPERIENCE_CATEGORIES, suggestedCategories } from "@/lib/constants";

type Props = {
  businessType: string | null | undefined;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Experience category dropdown that shows only the categories relevant to the
 * venue's business type (the full list if no business type is chosen yet).
 */
export default function ExperienceCategorySelect({ businessType, value, onChange, className, style }: Props) {
  const suggested = suggestedCategories(businessType);
  const options: readonly string[] = suggested.length > 0 ? suggested : EXPERIENCE_CATEGORIES;
  // Keep a saved value visible even if it isn't one of the options (e.g. imported from the venue database).
  const showSaved = value && !options.includes(value);

  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={className} style={style}>
      <option value="">{businessType ? "Select category…" : "Select a business type first…"}</option>
      {showSaved && <option value={value}>{value}</option>}
      {options.map((c) => <option key={c} value={c}>{c}</option>)}
    </select>
  );
}
