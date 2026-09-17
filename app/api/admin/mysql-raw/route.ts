import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getPool } from "@/lib/mysql-sync";

const STAGING_TABLE = process.env.MYSQL_VENUE_TABLE ?? "tbl_venues_near_you_staging";
const PROD_TABLE    = process.env.MYSQL_VENUE_TABLE_PROD ?? process.env.MYSQL_VENUE_TABLE ?? "tbl_venues_near_you_staging";

export async function GET(req: Request) {
  await requireAdmin();

  const { searchParams } = new URL(req.url);
  const q      = searchParams.get("q")?.trim() ?? "";
  const table  = searchParams.get("table") === "prod" ? PROD_TABLE : STAGING_TABLE;
  const limit  = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200);

  if (q.length < 2) {
    return NextResponse.json({ rows: [], total: 0 });
  }

  try {
    const pool = getPool();

    const term = `%${q}%`;
    const [rows] = await pool.execute<any[]>(
      `SELECT
         id, source, source_event_id,
         event_title, location_name, address, city, state, zip_code,
         business_type, experience_category, group_friendly,
         image_url, event_url, description,
         incentives, incentive_hint, incentives_json,
         latitude, longitude,
         date_updated
       FROM \`${table}\`
       WHERE event_title LIKE ?
          OR location_name LIKE ?
          OR address LIKE ?
          OR city LIKE ?
       ORDER BY date_updated DESC
       LIMIT ?`,
      [term, term, term, term, limit]
    );

    return NextResponse.json({ rows, total: rows.length, table });
  } catch (err: any) {
    console.error("[mysql-raw] Error:", err);
    return NextResponse.json({ error: err.message ?? "Query failed." }, { status: 500 });
  }
}
