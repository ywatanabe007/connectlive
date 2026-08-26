import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { syncVenueToMySQL } from "@/lib/mysql-sync";

type RouteParams = { params: Promise<{ venueId: string }> };

export async function POST(_req: Request, { params }: RouteParams) {
  await requireAdmin();
  const { venueId } = await params;

  const venue = await db.venue.findUnique({
    where: { id: venueId },
    include: { incentives: true },
  });

  if (!venue) return NextResponse.json({ error: "Venue not found" }, { status: 404 });

  await syncVenueToMySQL({
    ...venue,
    businessHours: venue.businessHours as any,
    incentives: venue.incentives as any,
  });

  return NextResponse.json({ success: true });
}
