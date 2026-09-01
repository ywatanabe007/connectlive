import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPool } from "@/lib/mysql-sync";

const VENUE_TABLE = process.env.MYSQL_VENUE_TABLE ?? "tbl_venues";

// POST /api/admin/venues/mysql-reset
// Body: { mysqlId: number }
// Resets a MySQL venue row back to unclaimed so it can be re-claimed.
export async function POST(req: Request) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session?.user?.id || role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { mysqlId } = await req.json();
  if (!mysqlId) {
    return NextResponse.json({ error: "Missing mysqlId." }, { status: 400 });
  }

  try {
    const pool = getPool();
    await pool.execute(
      `UPDATE \`${VENUE_TABLE}\` SET source = 'ConnectLive', source_event_id = NULL WHERE id = ?`,
      [mysqlId]
    );
    return NextResponse.json({ success: true, mysqlId });
  } catch (err: any) {
    console.error("[admin/venues/mysql-reset] Error:", err);
    return NextResponse.json({ error: err?.message ?? "Internal server error." }, { status: 500 });
  }
}
