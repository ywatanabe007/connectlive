import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getPool } from "@/lib/mysql-sync";

// Read from production table; fall back to the staging table if no prod var is set
const VENUE_TABLE = process.env.MYSQL_VENUE_TABLE_PROD ?? process.env.MYSQL_VENUE_TABLE ?? "tbl_venues_near_you_staging";

export async function GET(req: Request) {
  await requireAdmin();

  const { searchParams } = new URL(req.url);
  const page    = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit   = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "25")));
  const offset  = (page - 1) * limit;

  // Per-column filters
  const filterVenue      = searchParams.get("venue")?.trim() ?? "";
  const filterType       = searchParams.get("type")?.trim() ?? "";
  const filterSource     = searchParams.get("source") ?? "all";
  const filterIncentives = searchParams.get("incentives") ?? "all"; // all | has | none
  const filterDateFrom   = searchParams.get("dateFrom")?.trim() ?? "";
  const filterDateTo     = searchParams.get("dateTo")?.trim() ?? "";

  // Sorting
  const sortMap: Record<string, string> = {
    venue:      "event_title",
    type:       "business_type",
    source:     "source",
    incentives: "COALESCE(JSON_LENGTH(incentives_json), 0)",
    updated:    "date_updated",
  };
  const sortKey = searchParams.get("sort") ?? "updated";
  const sortDir = searchParams.get("dir") === "asc" ? "ASC" : "DESC";
  const orderCol = sortMap[sortKey] ?? "date_updated";
  const orderBy = `ORDER BY ${orderCol} ${sortDir}, id DESC`;

  try {
    const pool = getPool();

    // Build WHERE clause
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filterVenue) {
      conditions.push("(event_title LIKE ? OR location_name LIKE ? OR city LIKE ?)");
      params.push(`%${filterVenue}%`, `%${filterVenue}%`, `%${filterVenue}%`);
    }

    if (filterType) {
      conditions.push("(business_type LIKE ? OR experience_category LIKE ?)");
      params.push(`%${filterType}%`, `%${filterType}%`);
    }

    if (filterSource === "partner_portal") {
      conditions.push("source = 'partner_portal'");
    } else if (filterSource === "connectlive") {
      conditions.push("(source IS NULL OR source != 'partner_portal')");
    }

    if (filterIncentives === "has") {
      conditions.push("JSON_LENGTH(incentives_json) > 0");
    } else if (filterIncentives === "none") {
      conditions.push("(incentives_json IS NULL OR JSON_LENGTH(incentives_json) = 0)");
    }

    if (filterDateFrom) {
      conditions.push("date_updated >= ?");
      params.push(filterDateFrom);
    }
    if (filterDateTo) {
      conditions.push("date_updated <= ?");
      params.push(filterDateTo + " 23:59:59");
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    // Total count
    const [[{ total }]] = await pool.execute<any[]>(
      `SELECT COUNT(*) AS total FROM \`${VENUE_TABLE}\` ${where}`,
      params
    );

    // Data rows
    const [rows] = await pool.execute<any[]>(
      `SELECT id, event_title, location_name, address, city, state, zip_code,
              business_type, experience_category, source, source_event_id,
              incentive_category, incentives, incentive_hint, incentives_json,
              image_url, event_url, description, group_friendly,
              date_updated
       FROM \`${VENUE_TABLE}\` ${where}
       ${orderBy}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const venues = rows.map((r) => {
      let incentives: any[] = [];
      if (r.incentives_json) {
        try {
          incentives = typeof r.incentives_json === "string"
            ? JSON.parse(r.incentives_json)
            : r.incentives_json;
        } catch {
          incentives = [];
        }
      }
      return {
        mysqlId:            r.id,
        name:               (r.event_title ?? r.location_name ?? "").trim(),
        address:            r.address ?? "",
        city:               r.city ?? "",
        state:              r.state ?? "",
        zip:                r.zip_code ?? "",
        businessType:       r.business_type ?? null,
        experienceCategory: r.experience_category ?? null,
        source:             r.source ?? null,
        sourceEventId:      r.source_event_id ?? null,
        incentiveCategory:  r.incentive_category ?? null,
        incentiveSummary:   r.incentives ?? null,
        incentiveHint:      r.incentive_hint ?? null,
        imageUrl:           r.image_url ?? null,
        website:            r.event_url ?? null,
        description:        r.description ?? null,
        groupFriendly:      r.group_friendly === "Yes" || r.group_friendly === 1,
        dateUpdated:        r.date_updated ?? null,
        incentives,
      };
    });

    return NextResponse.json({
      venues,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[admin/mysql-venues] Error:", err);
    return NextResponse.json({ error: "Failed to fetch venues." }, { status: 500 });
  }
}
