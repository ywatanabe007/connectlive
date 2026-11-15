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

export const EVENT_TYPES = [
  "Concert", "Comedy Night", "Happy Hour", "Live Music", "DJ Night",
  "Trivia Night", "Open Mic", "Sports Viewing", "Wine Tasting", "Food Festival",
  "Art Show", "Networking", "Private Event", "Holiday Event",
  // Added Nov 2026 for sports / entertainment venues — the ConnectLive app must recognize these too.
  "Game / Match", "Tournament", "League Night", "Fan Event", "Family Event",
  "Movie Screening", "Exhibition", "Class / Workshop",
  "Other",
] as const;

export const EVENT_CATEGORIES = ["Arts & Theatre", "Film", "Misc.", "Hobby", "Music", "Sports"] as const;

export type EventType = (typeof EVENT_TYPES)[number];
export type EventCategory = (typeof EVENT_CATEGORIES)[number];

// Every venue can always host these.
const ALWAYS_EVENTS: readonly EventType[] = ["Private Event", "Holiday Event", "Other"];
const BAR_EVENTS: readonly EventType[] = ["Happy Hour", "Live Music", "DJ Night", "Trivia Night", "Open Mic", "Sports Viewing", "Wine Tasting", "Comedy Night", ...ALWAYS_EVENTS];
const FOOD_EVENTS: readonly EventType[] = ["Happy Hour", "Live Music", "Trivia Night", "Wine Tasting", "Food Festival", "Family Event", ...ALWAYS_EVENTS];
const CAFE_EVENTS: readonly EventType[] = ["Live Music", "Open Mic", "Art Show", "Class / Workshop", "Networking", ...ALWAYS_EVENTS];
const SHOW_EVENTS: readonly EventType[] = ["Concert", "Comedy Night", "Live Music", "Open Mic", "Art Show", "Networking", ...ALWAYS_EVENTS];

/** Event types that fit each business type, most relevant first. */
export const EVENT_TYPES_BY_BUSINESS_TYPE: Record<BusinessType, readonly EventType[]> = {
  "Restaurants & Food": FOOD_EVENTS,
  "Pizza Restaurant": FOOD_EVENTS,
  "Bar": BAR_EVENTS,
  "Bar & Grill": BAR_EVENTS,
  "Oceanfront Bar": BAR_EVENTS,
  "Rooftop Bar": BAR_EVENTS,
  "Tequila Bar": BAR_EVENTS,
  "Restaurant & Lounge": BAR_EVENTS,
  "Sports": ["Game / Match", "Tournament", "Sports Viewing", "Fan Event", "Family Event", "League Night", ...ALWAYS_EVENTS],
  "Sports Bar": ["Sports Viewing", "Fan Event", "Trivia Night", "Happy Hour", "Live Music", "DJ Night", ...ALWAYS_EVENTS],
  "Bowling": ["League Night", "Tournament", "Family Event", "DJ Night", ...ALWAYS_EVENTS],
  "Amusement": ["Family Event", "Tournament", ...ALWAYS_EVENTS],
  "Entertainment": ["Family Event", "Tournament", "Comedy Night", "Live Music", "DJ Night", "Trivia Night", ...ALWAYS_EVENTS],
  "Movie Theater": ["Movie Screening", "Family Event", ...ALWAYS_EVENTS],
  "Museum & Gallery": ["Exhibition", "Art Show", "Class / Workshop", "Family Event", "Networking", ...ALWAYS_EVENTS],
  "Live Music Venue": ["Concert", "Live Music", "DJ Night", "Open Mic", "Comedy Night", ...ALWAYS_EVENTS],
  "Live Show": SHOW_EVENTS,
  "Venue": SHOW_EVENTS,
  "Nightclub": ["DJ Night", "Live Music", "Concert", ...ALWAYS_EVENTS],
  "Casino": ["Concert", "Comedy Night", "Live Music", "DJ Night", "Tournament", ...ALWAYS_EVENTS],
  "Spa": ["Class / Workshop", ...ALWAYS_EVENTS],
  "Cafe": CAFE_EVENTS,
  "Dessert": CAFE_EVENTS,
  "Convenience Store": ALWAYS_EVENTS,
};

/** Event categories that fit each business type. */
export const EVENT_CATEGORIES_BY_BUSINESS_TYPE: Record<BusinessType, readonly EventCategory[]> = {
  "Restaurants & Food": ["Music", "Hobby", "Misc."],
  "Pizza Restaurant": ["Music", "Hobby", "Misc."],
  "Cafe": ["Music", "Arts & Theatre", "Hobby", "Misc."],
  "Dessert": ["Music", "Hobby", "Misc."],
  "Bar": ["Music", "Sports", "Arts & Theatre", "Misc."],
  "Bar & Grill": ["Music", "Sports", "Arts & Theatre", "Misc."],
  "Oceanfront Bar": ["Music", "Sports", "Arts & Theatre", "Misc."],
  "Rooftop Bar": ["Music", "Sports", "Arts & Theatre", "Misc."],
  "Tequila Bar": ["Music", "Sports", "Arts & Theatre", "Misc."],
  "Restaurant & Lounge": ["Music", "Sports", "Arts & Theatre", "Misc."],
  "Sports": ["Sports", "Misc."],
  "Sports Bar": ["Sports", "Music", "Misc."],
  "Bowling": ["Sports", "Hobby", "Misc."],
  "Amusement": ["Sports", "Hobby", "Misc."],
  "Entertainment": ["Music", "Arts & Theatre", "Film", "Sports", "Hobby", "Misc."],
  "Movie Theater": ["Film", "Misc."],
  "Museum & Gallery": ["Arts & Theatre", "Hobby", "Misc."],
  "Live Music Venue": ["Music", "Misc."],
  "Nightclub": ["Music", "Misc."],
  "Live Show": ["Music", "Arts & Theatre", "Film", "Misc."],
  "Venue": ["Music", "Arts & Theatre", "Film", "Sports", "Misc."],
  "Casino": ["Music", "Arts & Theatre", "Misc."],
  "Spa": ["Hobby", "Misc."],
  "Convenience Store": ["Misc."],
};

/** Event types for a business type (full list if unknown or not set). */
export function eventTypesFor(businessType: string | null | undefined): readonly string[] {
  return (businessType && EVENT_TYPES_BY_BUSINESS_TYPE[businessType as BusinessType]) || EVENT_TYPES;
}

/** Event categories for a business type (full list if unknown or not set). */
export function eventCategoriesFor(businessType: string | null | undefined): readonly string[] {
  return (businessType && EVENT_CATEGORIES_BY_BUSINESS_TYPE[businessType as BusinessType]) || EVENT_CATEGORIES;
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
