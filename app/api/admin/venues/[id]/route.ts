import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { getPool } from "@/lib/mysql-sync";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: RouteParams) {
  await requireAdmin();
  const { id } = await params;
  const body = await req.json();

  const venue = await db.venue.update({
    where: { id },
    data: { active: body.active },
  });

  return NextResponse.json(venue);
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  await requireAdmin();
  const { id } = await params;

  const venue = await db.venue.findUnique({ where: { id } });
  if (!venue) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Delete venue and cascade (incentives, events via Prisma relations)
  await db.venue.delete({ where: { id } });

  // Reset the MySQL row back to 'ConnectLive' so the venue can be claimed again
  try {
    const pool = getPool();
    const VENUE_TABLE = process.env.MYSQL_VENUE_TABLE ?? "tbl_venues";
    await pool.execute(
      `UPDATE \`${VENUE_TABLE}\` SET source = 'ConnectLive', source_event_id = NULL WHERE source_event_id = ? AND source = 'partner_portal'`,
      [id]
    );
  } catch (err) {
    console.error("[admin/venues DELETE] MySQL reset failed:", err);
  }

  return NextResponse.json({ success: true });
}
