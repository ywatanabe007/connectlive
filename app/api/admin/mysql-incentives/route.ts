import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getPool } from "@/lib/mysql-sync";

const VENUE_TABLE = process.env.MYSQL_VENUE_TABLE_PROD ?? process.env.MYSQL_VENUE_TABLE ?? "tbl_venues_near_you_staging";

export async function GET(req: Request) {
  await requireAdmin();

  const { searchParams } = new URL(req.url);
  const search   = searchParams.get("search")?.trim() ?? "";
  const page     = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit    = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50")));
  const offset   = (page - 1) * limit;

  try {
    const pool = getPool();

    const conditions: string[] = ["JSON_LENGTH(incentives_json) > 0"];
    const params: (string | number)[] = [];

    if (search) {
      conditions.push("(event_title LIKE ? OR location_name LIKE ? OR JSON_SEARCH(incentives_json, 'one', ?) IS NOT NULL)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const where = `WHERE ${conditions.join(" AND ")}`;

    // Count total incentives across all matching venues
    const [[{ total }]] = await pool.execute<any[]>(
      `SELECT SUM(COALESCE(JSON_LENGTH(incentives_json), 0)) AS total
       FROM \`${VENUE_TABLE}\` ${where}`,
      params
    );

    // Fetch venues with their incentives
    const [rows] = await pool.execute<any[]>(
      `SELECT id, event_title, location_name, city, state, source, incentives_json
       FROM \`${VENUE_TABLE}\` ${where}
       ORDER BY date_updated DESC, id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // Flatten venue rows into individual incentive records
    const incentives: any[] = [];
    for (const row of rows) {
      let incList: any[] = [];
      try {
        incList = typeof row.incentives_json === "string"
          ? JSON.parse(row.incentives_json)
          : (row.incentives_json ?? []);
      } catch { incList = []; }

      const venueName = (row.event_title ?? row.location_name ?? "").trim();
      for (const inc of incList) {
        incentives.push({
          venueId:    row.id,
          venueName,
          city:       row.city ?? "",
          state:      row.state ?? "",
          source:     row.source ?? "ConnectLive",
          title:      inc.title ?? "—",
          category:   inc.type ?? inc.category ?? "—",
          schedule:   inc.schedule ?? null,
          description: inc.description ?? inc.incentives ?? null,
          hint:       inc.incentive_hint ?? null,
          startDate:  inc.start_date ?? null,
          endDate:    inc.end_date ?? null,
          groupFriendly: inc.group_friendly === "Yes" || inc.group_friendly === true,
        });
      }
    }

    return NextResponse.json({
      incentives,
      pagination: {
        total: total ?? 0,
        page,
        limit,
        pages: Math.ceil((total ?? 0) / limit),
      },
    });
  } catch (err) {
    console.error("[admin/mysql-incentives] Error:", err);
    return NextResponse.json({ error: "Failed to fetch incentives." }, { status: 500 });
  }
}
