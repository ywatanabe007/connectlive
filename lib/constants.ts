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
] as const;

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
