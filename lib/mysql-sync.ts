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

function getPool(): mysql.Pool {
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

  // INSERT … ON DUPLICATE KEY UPDATE — safe upsert keyed on source_event_id
  const columns = Object.keys(row);
  const placeholders = columns.map(() => "?").join(", ");
  const updates = columns
    .filter((c) => c !== "source_event_id" && c !== "source")
    .map((c) => `\`${c}\` = VALUES(\`${c}\`)`)
    .join(", ");

  const sql = `
    INSERT INTO \`${VENUE_TABLE}\` (${columns.map((c) => `\`${c}\``).join(", ")})
    VALUES (${placeholders})
    ON DUPLICATE KEY UPDATE ${updates}
  `;

  await pool.execute(sql, Object.values(row));
}

/**
 * Remove a venue row from the mobile DB when it's deleted in the partner portal.
 * (Optional — you may prefer to set a status flag instead of hard-deleting.)
 */
export async function removeVenueFromMySQL(partnerPortalId: string): Promise<void> {
  const pool = getPool();
  await pool.execute(
    `DELETE FROM \`${VENUE_TABLE}\` WHERE source_event_id = ?`,
    [partnerPortalId]
  );
}
