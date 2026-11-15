export const BUSINESS_TYPES = [
  "Restaurants & Food",
  "Bar",
  "Amusement",
  "Museum & Gallery",
  "Convenience Store",
  "Casino",
  "Movie Theater",
  "Sports",
  "Cafe",
  "Venue",
  "Nightclub",
  "Live Music Venue",
  "Spa",
  "Bar & Grill",
  "Bowling",
  "Dessert",
  "Entertainment",
  "Live Show",
  "Oceanfront Bar",
  "Pizza Restaurant",
  "Restaurant & Lounge",
  "Rooftop Bar",
  "Sports Bar",
  "Tequila Bar",
] as const;

export const EXPERIENCE_CATEGORIES = [
  "Happy Hour",
  "Restaurant",
  "Live Music",
  "Pizza",
  "Burgers",
  "Coffee",
  "Mexican",
  "Bar",
  "Ramen",
  "BBQ",
  "Seafood",
  "Sushi",
  "Breakfast",
  "Brunch",
  "Wine Bar",
  // Non-food categories (added Nov 2026) — the ConnectLive app must recognize these too.
  "Sports & Games",
  "Watch Party",
  "Bowling",
  "Arcade & Amusement",
  "Movies",
  "Museum & Art",
  "Nightlife",
  "Comedy & Shows",
  "Casino",
  "Spa & Wellness",
  "Desserts",
  "Snacks & Convenience",
] as const;

export type BusinessType = (typeof BUSINESS_TYPES)[number];
export type ExperienceCategory = (typeof EXPERIENCE_CATEGORIES)[number];

/** Experience categories that fit each business type, most relevant first. */
export const CATEGORIES_BY_BUSINESS_TYPE: Record<BusinessType, readonly ExperienceCategory[]> = {
  "Restaurants & Food": ["Restaurant", "Happy Hour", "Pizza", "Burgers", "Mexican", "Ramen", "BBQ", "Seafood", "Sushi", "Breakfast", "Brunch", "Desserts"],
  "Bar": ["Bar", "Happy Hour", "Wine Bar", "Live Music", "Nightlife", "Watch Party"],
  "Amusement": ["Arcade & Amusement", "Sports & Games", "Bowling"],
  "Museum & Gallery": ["Museum & Art"],
  "Convenience Store": ["Snacks & Convenience", "Coffee"],
  "Casino": ["Casino", "Nightlife", "Live Music", "Comedy & Shows", "Restaurant"],
  "Movie Theater": ["Movies"],
  "Sports": ["Sports & Games", "Watch Party", "Bowling", "Arcade & Amusement"],
  "Cafe": ["Coffee", "Breakfast", "Brunch", "Desserts"],
  "Venue": ["Live Music", "Comedy & Shows", "Nightlife", "Sports & Games", "Museum & Art"],
  "Nightclub": ["Nightlife", "Bar", "Live Music"],
  "Live Music Venue": ["Live Music", "Nightlife", "Bar"],
  "Spa": ["Spa & Wellness"],
  "Bar & Grill": ["Bar", "Restaurant", "Happy Hour", "Burgers", "BBQ", "Watch Party"],
  "Bowling": ["Bowling", "Sports & Games", "Arcade & Amusement", "Bar"],
  "Dessert": ["Desserts", "Coffee"],
  "Entertainment": ["Arcade & Amusement", "Comedy & Shows", "Live Music", "Movies", "Sports & Games", "Nightlife"],
  "Live Show": ["Comedy & Shows", "Live Music"],
  "Oceanfront Bar": ["Bar", "Happy Hour", "Seafood", "Live Music"],
  "Pizza Restaurant": ["Pizza", "Restaurant", "Happy Hour"],
  "Restaurant & Lounge": ["Restaurant", "Bar", "Happy Hour", "Nightlife"],
  "Rooftop Bar": ["Bar", "Happy Hour", "Nightlife", "Wine Bar"],
  "Sports Bar": ["Watch Party", "Bar", "Happy Hour", "Burgers", "Sports & Games"],
  "Tequila Bar": ["Bar", "Happy Hour", "Mexican", "Nightlife"],
};

/** Suggested categories for a business type (empty if the type is unknown or not set). */
export function suggestedCategories(businessType: string | null | undefined): readonly string[] {
  return (businessType && CATEGORIES_BY_BUSINESS_TYPE[businessType as BusinessType]) || [];
}

export const INCENTIVE_CATEGORIES = [
  "Happy Hour",
  "Discount",
  "Free",
  "Live Music",
  "Group Booking",
  "Matinee Deal",
  "Early Entry",
  "No Incentive",
] as const;

export const US_TIMEZONES = [
  { label: "Eastern Time (ET)", value: "America/New_York" },
  { label: "Central Time (CT)", value: "America/Chicago" },
  { label: "Mountain Time (MT)", value: "America/Denver" },
  { label: "Pacific Time (PT)", value: "America/Los_Angeles" },
  { label: "Alaska Time (AKT)", value: "America/Anchorage" },
  { label: "Hawaii Time (HT)", value: "Pacific/Honolulu" },
] as const;

export const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type DayOfWeek = typeof DAYS_OF_WEEK[number];

export type BusinessHours = {
  [K in DayOfWeek]: { open: string; close: string; closed: boolean };
};

export const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  monday:    { open: "09:00", close: "22:00", closed: false },
  tuesday:   { open: "09:00", close: "22:00", closed: false },
  wednesday: { open: "09:00", close: "22:00", closed: false },
  thursday:  { open: "09:00", close: "22:00", closed: false },
  friday:    { open: "09:00", close: "23:00", closed: false },
  saturday:  { open: "10:00", close: "23:00", closed: false },
  sunday:    { open: "10:00", close: "21:00", closed: false },
};
