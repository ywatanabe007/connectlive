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
  // Added Nov 2026 for sports / entertainment venues — the ConnectLive app must recognize these too.
  "Game Day Special",
  "Watch Party",
  "Family Deal",
  "Bundle Deal",
  "Membership & Passes",
  "Food & Drink Special",
  "No Incentive",
] as const;

export type IncentiveCategory = (typeof INCENTIVE_CATEGORIES)[number];

const BAR_INCENTIVES: readonly IncentiveCategory[] = ["Happy Hour", "Food & Drink Special", "Live Music", "Discount", "Group Booking"];
const FOOD_INCENTIVES: readonly IncentiveCategory[] = ["Happy Hour", "Food & Drink Special", "Discount", "Family Deal", "Group Booking", "Bundle Deal"];
const SHOW_INCENTIVES: readonly IncentiveCategory[] = ["Early Entry", "Live Music", "Group Booking", "Bundle Deal", "Discount", "Food & Drink Special"];
const FAMILY_FUN_INCENTIVES: readonly IncentiveCategory[] = ["Family Deal", "Bundle Deal", "Group Booking", "Membership & Passes", "Discount", "Early Entry"];

/** Incentive (deal) types that fit each business type, most relevant first. */
export const INCENTIVES_BY_BUSINESS_TYPE: Record<BusinessType, readonly IncentiveCategory[]> = {
  "Restaurants & Food": FOOD_INCENTIVES,
  "Pizza Restaurant": FOOD_INCENTIVES,
  "Bar": [...BAR_INCENTIVES, "Watch Party"],
  "Bar & Grill": [...BAR_INCENTIVES, "Watch Party"],
  "Oceanfront Bar": BAR_INCENTIVES,
  "Rooftop Bar": BAR_INCENTIVES,
  "Tequila Bar": BAR_INCENTIVES,
  "Restaurant & Lounge": BAR_INCENTIVES,
  "Sports": ["Game Day Special", "Watch Party", "Group Booking", "Family Deal", "Discount", "Bundle Deal", "Membership & Passes", "Early Entry", "Food & Drink Special", "Free"],
  "Sports Bar": ["Watch Party", "Game Day Special", "Happy Hour", "Food & Drink Special", "Group Booking", "Discount"],
  "Bowling": ["Group Booking", "Family Deal", "Bundle Deal", "Discount", "Happy Hour", "Membership & Passes"],
  "Amusement": FAMILY_FUN_INCENTIVES,
  "Entertainment": [...FAMILY_FUN_INCENTIVES, "Live Music"],
  "Movie Theater": ["Matinee Deal", "Family Deal", "Bundle Deal", "Membership & Passes", "Discount"],
  "Museum & Gallery": ["Free", "Family Deal", "Membership & Passes", "Group Booking", "Discount", "Early Entry"],
  "Live Music Venue": SHOW_INCENTIVES,
  "Live Show": SHOW_INCENTIVES,
  "Venue": SHOW_INCENTIVES,
  "Nightclub": ["Early Entry", "Free", "Group Booking", "Happy Hour", "Live Music"],
  "Casino": ["Food & Drink Special", "Free", "Membership & Passes", "Live Music", "Discount"],
  "Spa": ["Discount", "Bundle Deal", "Membership & Passes", "Group Booking"],
  "Cafe": ["Discount", "Food & Drink Special", "Bundle Deal", "Free"],
  "Dessert": ["Discount", "Food & Drink Special", "Bundle Deal", "Free"],
  "Convenience Store": ["Discount", "Bundle Deal", "Free"],
};

/** Suggested incentive types for a business type (empty if unknown or not set). */
export function suggestedIncentiveCategories(businessType: string | null | undefined): readonly string[] {
  return (businessType && INCENTIVES_BY_BUSINESS_TYPE[businessType as BusinessType]) || [];
}

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
