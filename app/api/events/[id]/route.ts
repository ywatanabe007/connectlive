import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

type RouteParams = { params: Promise<{ id: string }> };

async function getOwnedEvent(eventId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized", status: 401, event: null };

  const venue = await db.venue.findUnique({ where: { ownerId: session.user.id } });
  if (!venue) return { error: "No venue found", status: 404, event: null };

  const event = await db.event.findFirst({
    where: { id: eventId, venueId: venue.id },
  });
  if (!event) return { error: "Not found", status: 404, event: null };

  return { error: null, status: 200, event };
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const { id } = await params;
  const { error, status, event } = await getOwnedEvent(id);
  if (error || !event) return NextResponse.json({ error }, { status });

  const data = await req.json();
  const { id: _id, venueId: _v, ...safeData } = data;

  if (safeData.date) safeData.date = new Date(safeData.date);

  const updated = await db.event.update({ where: { id }, data: safeData });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  const { error, status, event } = await getOwnedEvent(id);
  if (error || !event) return NextResponse.json({ error }, { status });

  await db.event.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
