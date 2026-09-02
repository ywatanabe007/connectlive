import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { syncVenueToMySQL } from "@/lib/mysql-sync";

type RouteParams = { params: Promise<{ id: string }> };

async function getOwnedIncentive(incentiveId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized", status: 401, incentive: null, venue: null };

  const venue = await db.venue.findUnique({ where: { ownerId: session.user.id } });
  if (!venue) return { error: "No venue found", status: 404, incentive: null, venue: null };

  const incentive = await db.incentive.findFirst({
    where: { id: incentiveId, venueId: venue.id },
  });
  if (!incentive) return { error: "Not found", status: 404, incentive: null, venue: null };

  return { error: null, status: 200, incentive, venue };
}

async function syncAfterChange(venueId: string, venue: any) {
  const incentives = await db.incentive.findMany({ where: { venueId } });
  try {
    await syncVenueToMySQL({
      ...venue,
      businessHours: venue.businessHours as any,
      incentives: incentives as any,
    });
  } catch (err) {
    console.error("[mysql-sync] incentive [id] sync failed:", err);
  }
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const { id } = await params;
  const { error, status, incentive, venue } = await getOwnedIncentive(id);
  if (error || !incentive || !venue) {
    return NextResponse.json({ error }, { status });
  }

  const data = await req.json();
  const { id: _id, venueId: _v, ...safeData } = data;

  if (safeData.startAt) safeData.startAt = new Date(safeData.startAt);
  if (safeData.endAt) safeData.endAt = new Date(safeData.endAt);

  const updated = await db.incentive.update({ where: { id }, data: safeData });

  // Sync updated incentive list to mobile MySQL (awaited so errors surface in logs)
  await syncAfterChange(venue.id, venue);

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  const { error, status, incentive, venue } = await getOwnedIncentive(id);
  if (error || !incentive || !venue) {
    return NextResponse.json({ error }, { status });
  }

  await db.redemption.deleteMany({ where: { incentiveId: id } });
  await db.incentive.delete({ where: { id } });

  // Sync updated incentive list to mobile MySQL (incentive now removed)
  await syncAfterChange(venue.id, venue);

  return NextResponse.json({ success: true });
}
