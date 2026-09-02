/**
 * ConnectLive MySQL Sync
 * Syncs partner portal venue + incentive data to the mobile app's MySQL database.
 *
 * One row per venue in the mobile DB.
 * Incentives are embedded as a JSON array in `incentives_json`.
 *
 * TABLE NAME: set MYSQL_VENUE_TABLE in your .env (e.g. "tbl_venues")
 * — confirm the exact table name with the mobile dev team.
 */

import mysql from "mysql2/promise";
import type { BusinessHours } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Connection pool (re-used across requests in the same serverless container)
// ---------------------------------------------------------------------------
let pool: mysql.Pool | null = null;

function getSslConfig(): object {
  if (process.env.MYSQL_CA_CERT) {
    return {
      ca: Buffer.from(process.env.MYSQL_CA_CERT, "base64").toString("utf8"),
      rejectUnauthorized: false,
    };
  }
  return { rejectUnauthorized: false };
}

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST,
      port: parseInt(process.env.MYSQL_PORT ?? "25060"),
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      ssl: getSslConfig(),
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
    });
  }
  return pool;
}

const VENUE_TABLE = process.env.MYSQL_VENUE_TABLE ?? "tbl_venues";
const EVENT_TABLE = process.env.MYSQL_EVENT_TABLE ?? "tbl_venues_near_you_staging";

// ---------------------------------------------------------------------------
// Type definitions
// ---------------------------------------------------------------------------

type PortalIncentive = {
  id: string;
  title: string;
  description: string;
  teaserText: string | null;
  category: string;
  validTimes: string | null;
  recurrence: string;
  startAt: Date | string;
  endAt: Date | string;
  maxRedemptions: number | null;
  redemptionCount: number;
  groupFriendly: boolean;
  terms: string | null;
  status: string;
};

type PortalVenue = {
  id: string;                          // cuid — used as source_event_id
  name: string;
  businessType: string | null;
  experienceCategory: string | null;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
  phone: string | null;
  website: string | null;
  imageUrl: string | null;
  description: string | null;
  groupFriendly: boolean;
  timeZone: string | null;
  businessHours: BusinessHours | null;
  incentives?: PortalIncentive[];
};

// ---------------------------------------------------------------------------
// Exported helpers used by signup/claim routes
// ---------------------------------------------------------------------------

/**
 * Convert Google Places operating_hours format:
 *   { days: { 0: { periods: [{open:"HH:MM", close:"HH:MM"}] }, ... } }
 * to the portal's BusinessHours format:
 *   { monday: { open, close, closed }, ... }
 * Google day 0 = Sunday.
 */
export function convertOperatingHours(raw: any): Record<string, { open: string; close: string; closed: boolean }> | null {
  if (!raw) return null;
  const days = raw.days ?? raw;
  if (typeof days !== "object") return null;

  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const result: Record<string, { open: string; close: string; closed: boolean }> = {};

  for (let i = 0; i < 7; i++) {
    const name = dayNames[i];
    const entry = days[i] ?? days[String(i)];
    if (!entry || entry.closed || !entry.periods?.length) {
      result[name] = { open: "09:00", close: "22:00", closed: true };
    } else {
      const period = entry.periods[0];
      result[name] = {
        open: period.open ?? "09:00",
        close: period.close ?? "22:00",
        closed: false,
      };
    }
  }
  return result;
}

/**
 * Strip scraper metadata lines from a venue description so only human-readable
 * prose remains. Returns null when nothing meaningful is left.
 */
export function cleanScrapedDescription(raw: string | null | undefined): string | null {
  if (!raw) return null;

  const junkPatterns = [
    /^Rating:\s*/i,
    /^Price:\s*/i,
    /^Phone:\s*/i,
    /^Hours:\s*/i,
    /^Address:\s*/i,
    /^Website:\s*/i,
    /^\{.*\}$/,          // JSON blob lines
    /^\[.*\]$/,          // JSON array lines
  ];

  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => {
      if (!l) return false;
      if (junkPatterns.some((p) => p.test(l))) return false;
      // Short comma-separated tag lists (≤4 words per segment, ≥2 segments)
      const parts = l.split(",");
      if (parts.length >= 2 && parts.every((p) => p.trim().split(/\s+/).length <= 4)) return false;
      return true;
    });

  const cleaned = lines.join("\n").trim();
  return cleaned || null;
}

// ---------------------------------------------------------------------------
// Field transformers
// ---------------------------------------------------------------------------

/**
 * Convert our Mon-keyed BusinessHours to the mobile app's 0-6 (Sun-Sat) JSON format.
 * Mobile format: { [0-6]: { periods: [{ open: "HH:MM", close: "HH:MM" }] } }
 */
function transformBusinessHours(hours: BusinessHours | null): object | null {
  if (!hours) return null;

  const dayMap: Array<keyof BusinessHours> = [
    "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday",
  ];

  const result: Record<number, { periods: Array<{ open: string; close: string }> }> = {};
  dayMap.forEach((day, index) => {
    const h = hours[day];
    result[index] = h?.closed
      ? { periods: [] }                                  // empty periods = closed
      : { periods: [{ open: h?.open ?? "09:00", close: h?.close ?? "22:00" }] };
  });
  return result;
}

/**
 * Map our recurrence string to the mobile app's expiration_status field.
 */
function toExpirationStatus(recurrence: string): string {
  if (recurrence === "ONE_TIME") return "Expires";
  return "Ongoing";
}

/**
 * Build the incentives_json array from our incentives list.
 * Mobile format: [{ id, title, description, type, schedule, priority, teaser, terms }]
 */
function buildIncentivesJson(incentives: PortalIncentive[]): object[] {
  return incentives
    .filter((i) => i.status === "ACTIVE")
    .map((i, index) => ({
      id: i.id,
      title: i.title,
      incentives: i.description,
      incentive_hint: i.teaserText ?? null,
      type: i.category,
      schedule: i.validTimes ?? null,
      recurrence: i.recurrence,
      priority: index + 1,
      start_date: i.startAt,
      end_date: i.endAt,
      group_friendly: i.groupFriendly ? "Yes" : "No",
      terms: i.terms ?? null,
      max_redemptions: i.maxRedemptions ?? null,
      redemption_count: i.redemptionCount,
    }));
}

/**
 * Pick the primary incentive category from the list (first active one wins).
 */
function primaryIncentiveCategory(incentives: PortalIncentive[]): string | null {
  return incentives.find((i) => i.status === "ACTIVE")?.category ?? null;
}

/**
 * Pick the primary valid times / timing restrictions.
 */
function primaryTimingRestrictions(incentives: PortalIncentive[]): string | null {
  return incentives.find((i) => i.status === "ACTIVE" && i.validTimes)?.validTimes ?? null;
}

// ---------------------------------------------------------------------------
// Main sync function — upsert venue row (insert or update on duplicate key)
// ---------------------------------------------------------------------------

export async function syncVenueToMySQL(
  venue: PortalVenue
): Promise<void> {
  const pool = getPool();

  const incentives = venue.incentives ?? [];
  const incentivesJson = buildIncentivesJson(incentives);
  const operatingHours = transformBusinessHours(venue.businessHours);

  // Build a plain text incentives summary for the legacy `incentives` text column
  const incentivesSummary = incentivesJson
    .map((i: any) => `${i.incentives}${i.schedule ? ` (${i.schedule})` : ""}`)
    .join("; ") || null;

  const row = {
    source_event_id:    venue.id,                                      // our cuid
    source:             "partner_portal",
    event_title:        venue.name,
    location_name:      venue.name,
    address:            venue.address,
    city:               venue.city,
    state:              venue.state,
    zip_code:           venue.zip,
    latitude:           venue.lat,
    longitude:          venue.lng,
    business_type:      venue.businessType ?? null,
    experience_category: venue.experienceCategory ?? null,
    incentive_category: primaryIncentiveCategory(incentives),
    timing_restrictions: primaryTimingRestrictions(incentives),
    group_friendly:     venue.groupFriendly ? "Yes" : "No",
    description:        venue.description ?? null,
    event_url:          venue.website ?? null,
    image_url:          venue.imageUrl ?? null,
    operating_hours:    operatingHours ? JSON.stringify(operatingHours) : null,
    hours_timezone:     venue.timeZone ?? null,
    hours_source:       "partner_portal",
    incentives:         incentivesSummary,
    incentive_hint:     incentives.find((i) => i.status === "ACTIVE")?.teaserText ?? null,
    incentives_json:    incentivesJson.length > 0 ? JSON.stringify(incentivesJson) : null,
    expiration_status:  incentives.length > 0
                          ? toExpirationStatus(incentives[0].recurrence)
                          : null,
    incentives_source:  "partner_portal",
    date_updated:       new Date(),
  };

  // Use plain UPDATE keyed on source_event_id.
  // INSERT … ON DUPLICATE KEY UPDATE only fires when there's a UNIQUE index on
  // source_event_id — which the scraped MySQL table may not have.  A targeted
  // UPDATE is always safe once the row is claimed.

  // Diagnostic: confirm the row exists before attempting the update.
  const [checkRows] = await pool.execute<any[]>(
    `SELECT id, source_event_id FROM \`${VENUE_TABLE}\` WHERE source_event_id = ? LIMIT 1`,
    [row.source_event_id]
  );
  if (!checkRows.length) {
    console.error(
      `[mysql-sync] No MySQL row found with source_event_id=${row.source_event_id} — sync skipped`
    );
    return;
  }
  console.log(
    `[mysql-sync] Found MySQL row id=${checkRows[0].id} for source_event_id=${row.source_event_id}`
  );

  // Only update columns we know exist in the scraped table to avoid
  // "Unknown column" errors on tables with varying schemas.
  const safeColumns = [
    "event_title", "location_name", "address", "city", "state", "zip_code",
    "latitude", "longitude", "business_type", "experience_category",
    "incentive_category", "timing_restrictions", "group_friendly",
    "description", "event_url", "image_url", "operating_hours",
    "hours_timezone", "hours_source", "incentives", "incentive_hint",
    "incentives_json", "expiration_status", "incentives_source", "date_updated",
  ] as const;

  const setClauses = safeColumns.map((c) => `\`${c}\` = ?`).join(", ");
  const values = safeColumns.map((c) => (row as any)[c] ?? null);

  const sql = `UPDATE \`${VENUE_TABLE}\` SET ${setClauses} WHERE source_event_id = ?`;

  const [result] = await pool.execute(sql, [...values, row.source_event_id]) as any;
  console.log(`[mysql-sync] UPDATE done: affectedRows=${result?.affectedRows}`);
}

/**
 * Remove a venue row from the mobile DB when it's deleted in the partner portal.
 */
export async function removeVenueFromMySQL(partnerPortalId: string): Promise<void> {
  const pool = getPool();
  await pool.execute(
    `DELETE FROM \`${VENUE_TABLE}\` WHERE source_event_id = ? AND source = 'partner_portal'`,
    [partnerPortalId]
  );
}

// ---------------------------------------------------------------------------
// Venue claim helpers
// ---------------------------------------------------------------------------

export type ClaimableVenue = {
  mysqlId: number;
  sourceEventId: string | null;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string | null;
  website: string | null;
  imageUrl: string | null;
  description: string | null;
  businessType: string | null;
  experienceCategory: string | null;
  groupFriendly: boolean;
  lat: number | null;
  lng: number | null;
};

/**
 * Search for unclaimed venues (source = 'ConnectLive') by name and optional city.
 */
export async function searchClaimableVenues(
  name: string,
  city?: string
): Promise<ClaimableVenue[]> {
  const pool = getPool();

  let sql = `SELECT * FROM \`${VENUE_TABLE}\` WHERE (source IS NULL OR source != 'partner_portal') AND (event_title LIKE ? OR location_name LIKE ?)`;
  const params: string[] = [`%${name}%`, `%${name}%`];

  if (city?.trim()) {
    sql += ` AND city LIKE ?`;
    params.push(`%${city.trim()}%`);
  }

  sql += ` LIMIT 10`;

  const [rows] = await pool.execute<mysql.RowDataPacket[]>(sql, params);

  return rows.map((r) => ({
    mysqlId: r.id as number,
    sourceEventId: (r.source_event_id ?? null) as string | null,
    name: ((r.event_title ?? r.location_name ?? r.name ?? "") as string),
    address: ((r.address ?? r.street_address ?? "") as string),
    city: ((r.city ?? "") as string),
    state: ((r.state ?? "") as string),
    zip: ((r.zip_code ?? r.zip ?? r.postal_code ?? "") as string),
    phone: ((r.phone ?? r.phone_number ?? null) as string | null),
    website: ((r.event_url ?? r.website ?? r.url ?? null) as string | null),
    imageUrl: ((r.image_url ?? r.photo_url ?? r.cover_image ?? null) as string | null),
    description: ((r.description ?? r.about ?? null) as string | null),
    businessType: ((r.business_type ?? r.type ?? null) as string | null),
    experienceCategory: ((r.experience_category ?? r.category ?? null) as string | null),
    groupFriendly: r.group_friendly === "Yes" || r.group_friendly === 1 || r.group_friendly === true,
    lat: ((r.latitude ?? r.lat ?? null) as number | null),
    lng: ((r.longitude ?? r.lng ?? r.lon ?? null) as number | null),
  }));
}

/**
 * Mark a scraped venue row as claimed by the partner portal.
 * Updates source → 'partner_portal' and source_event_id → the new Neon venue ID.
 */
export async function markVenueAsClaimed(
  mysqlId: number,
  portalVenueId: string
): Promise<void> {
  const pool = getPool();
  await pool.execute(
    `UPDATE \`${VENUE_TABLE}\` SET source = 'partner_portal', source_event_id = ? WHERE id = ?`,
    [portalVenueId, mysqlId]
  );
}

// ---------------------------------------------------------------------------
// Event types
// ---------------------------------------------------------------------------

type PortalEvent = {
  id: string;
  venueId: string;
  title: string;
  description: string | null;
  date: Date | string;
  startTime: string;
  endTime: string | null;
  coverCharge: number | null;
  imageUrl: string | null;
  eventType: string | null;
  category: string | null;
  businessType: string | null;
  experienceCategory: string | null;
  timingRestrictions: string | null;
  groupFriendly: boolean;
  incentiveHint: string | null;
  incentiveDesc: string | null;
  eventUrl: string | null;
  status: string;
};

type PortalVenueBasic = {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
  businessType: string | null;
  experienceCategory: string | null;
  groupFriendly: boolean;
};

/**
 * Format a date + time string into MySQL DATETIME format: YYYY-MM-DD HH:MM:SS
 */
function toMySQLDatetime(date: Date | string, time: string): string {
  const d = new Date(date);
  const dateStr = d.toISOString().slice(0, 10); // YYYY-MM-DD
  // Ensure time is HH:MM:SS
  const timeParts = time.split(":");
  const timeStr = `${timeParts[0] ?? "00"}:${timeParts[1] ?? "00"}:${timeParts[2] ?? "00"}`;
  return `${dateStr} ${timeStr}`;
}

/**
 * Upsert a partner event into the mobile DB.
 * Uses source = "partner_event" and source_event_id (our portal cuid) as the unique key.
 * Requires tbl_venues_near_you_staging to have:
 *   source_event_id varchar(255), UNIQUE INDEX uq_source_event (source_event_id, source)
 */
export async function syncEventToMySQL(
  event: PortalEvent,
  venue: PortalVenueBasic
): Promise<void> {
  const pool = getPool();

  const startDatetime = toMySQLDatetime(event.date, event.startTime);
  const endDatetime = event.endTime
    ? toMySQLDatetime(event.date, event.endTime)
    : null;

  const row: Record<string, string | number | boolean | Date | null> = {
    source_event_id: event.id,
    source:          "partner_event",
    event_title:     event.title,
    location_name:   venue.name,
    address:         venue.address,
    city:            venue.city,
    state:           venue.state,
    zip_code:        venue.zip,
    event_type:      event.eventType ?? null,
    category:        event.category ?? null,
    description:     event.description ?? null,
    start_date:      startDatetime,
    end_date:        endDatetime,
    event_url:       event.eventUrl ?? null,
    image_url:       event.imageUrl ?? null,
  };

  const columns = Object.keys(row);
  const placeholders = columns.map(() => "?").join(", ");
  const updates = columns
    .filter((c) => c !== "source_event_id" && c !== "source")
    .map((c) => `\`${c}\` = VALUES(\`${c}\`)`)
    .join(", ");

  const sql = `
    INSERT INTO \`${EVENT_TABLE}\` (${columns.map((c) => `\`${c}\``).join(", ")})
    VALUES (${placeholders})
    ON DUPLICATE KEY UPDATE ${updates}
  `;

  await pool.execute(sql, Object.values(row));
}

/**
 * Remove a partner event row from the mobile DB when deleted in the portal.
 */
export async function removeEventFromMySQL(eventId: string): Promise<void> {
  const pool = getPool();
  await pool.execute(
    `DELETE FROM \`${EVENT_TABLE}\` WHERE source_event_id = ? AND source = 'partner_event'`,
    [eventId]
  );
}
