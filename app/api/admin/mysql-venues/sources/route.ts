import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getPool } from "@/lib/mysql-sync";

const VENUE_TABLE = process.env.MYSQL_VENUE_TABLE_PROD ?? process.env.MYSQL_VENUE_TABLE ?? "tbl_venues_near_you_staging";

export async function GET() {
  await requireAdmin();

  try {
    const pool = getPool();
    const [rows] = await pool.execute<any[]>(
      `SELECT DISTINCT COALESCE(source, 'ConnectLive') AS source
       FROM \`${VENUE_TABLE}\`
       ORDER BY source ASC`
    );
    const sources = rows.map((r) => r.source as string).filter(Boolean);
    return NextResponse.json({ sources });
  } catch (err) {
    console.error("[admin/mysql-venues/sources] Error:", err);
    return NextResponse.json({ sources: [] }, { status: 500 });
  }
}
