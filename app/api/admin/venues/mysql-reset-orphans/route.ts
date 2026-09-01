import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { getPool } from "@/lib/mysql-sync";

const VENUE_TABLE = process.env.MYSQL_VENUE_TABLE ?? "tbl_venues";

// POST /api/admin/venues/mysql-reset-orphans
// Finds all MySQL rows marked source='partner_portal' whose source_event_id
// does not match any Neon venue, and resets them to source='ConnectLive'.
export async function POST() {
  await requireAdmin();

  try {
    const pool = getPool();

    // Get all claimed MySQL rows
    const [rows] = await pool.execute<any[]>(
      `SELECT id, source_event_id FROM \`${VENUE_TABLE}\` WHERE source = 'partner_portal' AND source_event_id IS NOT NULL`
    );

    // Get all Neon venue IDs
    const neonVenues = await db.venue.findMany({ select: { id: true } });
    const neonIds = new Set(neonVenues.map((v) => v.id));

    // Find orphans — claimed in MySQL but no matching Neon venue
    const orphanMysqlIds: number[] = rows
      .filter((r) => !neonIds.has(r.source_event_id))
      .map((r) => r.id);

    if (orphanMysqlIds.length === 0) {
      return NextResponse.json({ reset: 0, message: "No orphans found." });
    }

    // Reset them all
    const placeholders = orphanMysqlIds.map(() => "?").join(", ");
    await pool.execute(
      `UPDATE \`${VENUE_TABLE}\` SET source = 'ConnectLive', source_event_id = NULL WHERE id IN (${placeholders})`,
      orphanMysqlIds
    );

    return NextResponse.json({ reset: orphanMysqlIds.length, mysqlIds: orphanMysqlIds });
  } catch (err: any) {
    console.error("[admin/venues/mysql-reset-orphans] Error:", err);
    return NextResponse.json({ error: err?.message ?? "Internal server error." }, { status: 500 });
  }
}
