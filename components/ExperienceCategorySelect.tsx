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
 * Experience category dropdown that puts the categories matching the venue's
 * business type first, with every other category still available below.
 */
export default function ExperienceCategorySelect({ businessType, value, onChange, className, style }: Props) {
  const suggested = suggestedCategories(businessType);
  const others = EXPERIENCE_CATEGORIES.filter((c) => !suggested.includes(c));
  // Keep a saved value visible even if it isn't in our list (e.g. imported from the venue database).
  const isUnknown = value && !(EXPERIENCE_CATEGORIES as readonly string[]).includes(value);

  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={className} style={style}>
      <option value="">{businessType ? "Select category…" : "Select a business type first…"}</option>
      {isUnknown && <option value={value}>{value}</option>}
      {suggested.length > 0 ? (
        <>
          <optgroup label={`Suggested for ${businessType}`}>
            {suggested.map((c) => <option key={c} value={c}>{c}</option>)}
          </optgroup>
          <optgroup label="Other categories">
            {others.map((c) => <option key={c} value={c}>{c}</option>)}
          </optgroup>
        </>
      ) : (
        EXPERIENCE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)
      )}
    </select>
  );
}
