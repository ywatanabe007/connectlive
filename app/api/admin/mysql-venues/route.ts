import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getPool } from "@/lib/mysql-sync";

// Read from production table; fall back to the staging table if no prod var is set
const VENUE_TABLE = process.env.MYSQL_VENUE_TABLE_PROD ?? process.env.MYSQL_VENUE_TABLE ?? "tbl_venues_near_you_staging";

export async function GET(req: Request) {
  await requireAdmin();

  const { searchParams } = new URL(req.url);
  const search  = searchParams.get("search")?.trim() ?? "";
  const source  = searchParams.get("source") ?? "all";   // all | partner_portal | connectlive
  const page    = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit   = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "25")));
  const offset  = (page - 1) * limit;

  try {
    const pool = getPool();

    // Build WHERE clause
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (search) {
      conditions.push("(event_title LIKE ? OR location_name LIKE ? OR city LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (source === "partner_portal") {
      conditions.push("source = 'partner_portal'");
    } else if (source === "connectlive") {
      conditions.push("(source IS NULL OR source != 'partner_portal')");
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
       ORDER BY date_updated DESC, id DESC
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
