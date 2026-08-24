import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

type RouteParams = { params: Promise<{ id: string }> };

async function getOwnedIncentive(incentiveId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized", status: 401, incentive: null };

  const venue = await db.venue.findUnique({ where: { ownerId: session.user.id } });
  if (!venue) return { error: "No venue found", status: 404, incentive: null };

  const incentive = await db.incentive.findFirst({
    where: { id: incentiveId, venueId: venue.id },
  });
  if (!incentive) return { error: "Not found", status: 404, incentive: null };

  return { error: null, status: 200, incentive };
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const { id } = await params;
  const { error, status, incentive } = await getOwnedIncentive(id);
  if (error || !incentive) {
    return NextResponse.json({ error }, { status });
  }

  const data = await req.json();

  // Don't allow id/venueId changes
  const { id: _id, venueId: _v, ...safeData } = data;

  if (safeData.startAt) safeData.startAt = new Date(safeData.startAt);
  if (safeData.endAt) safeData.endAt = new Date(safeData.endAt);

  const updated = await db.incentive.update({ where: { id }, data: safeData });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  const { error, status, incentive } = await getOwnedIncentive(id);
  if (error || !incentive) {
    return NextResponse.json({ error }, { status });
  }

  // Delete redemptions first
  await db.redemption.deleteMany({ where: { incentiveId: id } });
  await db.incentive.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
