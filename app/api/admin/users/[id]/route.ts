import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { getPool } from "@/lib/mysql-sync";

const VENUE_TABLE = process.env.MYSQL_VENUE_TABLE ?? "tbl_venues";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: RouteParams) {
  await requireAdmin();
  const { id } = await params;
  const { role } = await req.json();

  const allowed = ["USER", "VENUE_OWNER", "ADMIN"];
  if (!allowed.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const user = await db.user.update({ where: { id }, data: { role } });
  return NextResponse.json(user);
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  await requireAdmin();
  const { id } = await params;

  const user = await db.user.findUnique({
    where: { id },
    include: { venue: { include: { incentives: true, events: true } } },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Delete venue children first to satisfy foreign key constraints
  if (user.venue) {
    const venueId = user.venue.id;

    // Reset the MySQL source row so the venue reappears in search for future claims
    try {
      const pool = getPool();
      await pool.execute(
        `UPDATE \`${VENUE_TABLE}\` SET source = 'ConnectLive', source_event_id = NULL WHERE source_event_id = ?`,
        [venueId]
      );
    } catch (err) {
      console.error("[admin/users DELETE] Failed to reset MySQL venue row:", err);
    }
    // Redemptions reference incentives, so clear them first
    const incentiveIds = user.venue.incentives.map((i) => i.id);
    if (incentiveIds.length > 0) {
      await db.redemption.deleteMany({ where: { incentiveId: { in: incentiveIds } } });
    }
    await db.incentive.deleteMany({ where: { venueId } });
    await db.event.deleteMany({ where: { venueId } });
    await db.venue.delete({ where: { id: venueId } });
  }

  await db.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
