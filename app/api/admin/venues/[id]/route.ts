import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { getPool, syncVenueToMySQL } from "@/lib/mysql-sync";

const VENUE_TABLE = process.env.MYSQL_VENUE_TABLE ?? "tbl_venues";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: RouteParams) {
  await requireAdmin();
  const { id } = await params;
  const body = await req.json();

  // Allowlist updatable fields
  const {
    active, name, address, city, state, zip,
    phone, website, imageUrl, description,
    businessType, experienceCategory, groupFriendly, timeZone,
  } = body;

  const data: Record<string, unknown> = {};
  if (active      !== undefined) data.active             = active;
  if (name        !== undefined) data.name               = name.trim();
  if (address     !== undefined) data.address            = address.trim();
  if (city        !== undefined) data.city               = city.trim();
  if (state       !== undefined) data.state              = state.trim().toUpperCase();
  if (zip         !== undefined) data.zip                = zip.trim();
  if (phone       !== undefined) data.phone              = phone?.trim() || null;
  if (website     !== undefined) data.website            = website?.trim() || null;
  if (imageUrl    !== undefined) data.imageUrl           = imageUrl?.trim() || null;
  if (description !== undefined) data.description        = description?.trim() || null;
  if (businessType       !== undefined) { data.businessType = businessType || null; data.type = businessType || ""; }
  if (experienceCategory !== undefined) data.experienceCategory = experienceCategory || null;
  if (groupFriendly      !== undefined) data.groupFriendly = !!groupFriendly;
  if (timeZone           !== undefined) data.timeZone = timeZone || null;

  const venue = await db.venue.update({ where: { id }, data });

  // Keep MySQL in sync when content fields change (not just active toggle)
  const contentChanged = Object.keys(data).some((k) => k !== "active");
  if (contentChanged) {
    try {
      const incentives = await db.incentive.findMany({ where: { venueId: id } });
      await syncVenueToMySQL({ ...venue, businessHours: venue.businessHours as any, incentives: incentives as any });
    } catch (err) {
      console.error("[admin/venues PATCH] MySQL sync failed:", err);
    }
  }

  return NextResponse.json(venue);
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  await requireAdmin();
  const { id } = await params;

  const venue = await db.venue.findUnique({ where: { id } });
  if (!venue) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.venue.delete({ where: { id } });

  // Reset the MySQL row so the venue can be claimed again
  try {
    const pool = getPool();
    await pool.execute(
      `UPDATE \`${VENUE_TABLE}\` SET source = 'ConnectLive', source_event_id = NULL WHERE source_event_id = ? AND source = 'partner_portal'`,
      [id]
    );
  } catch (err) {
    console.error("[admin/venues DELETE] MySQL reset failed:", err);
  }

  return NextResponse.json({ success: true });
}
