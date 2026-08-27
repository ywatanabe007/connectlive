import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { syncEventToMySQL } from "@/lib/mysql-sync";

async function getVenueForSession() {
  const session = await auth();
  if (!session?.user?.id) return { session: null, venue: null };
  const venue = await db.venue.findUnique({ where: { ownerId: session.user.id } });
  return { session, venue };
}

export async function GET() {
  const { session, venue } = await getVenueForSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!venue) return NextResponse.json({ error: "No venue found" }, { status: 404 });

  const events = await db.event.findMany({
    where: { venueId: venue.id },
    orderBy: { date: "asc" },
  });

  return NextResponse.json(events);
}

export async function POST(req: Request) {
  const { session, venue } = await getVenueForSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!venue) return NextResponse.json({ error: "No venue found" }, { status: 404 });

  try {
    const {
      title, description, date, startTime, endTime, coverCharge, imageUrl,
      eventType, category, businessType, experienceCategory, timingRestrictions,
      groupFriendly, incentiveHint, incentiveDesc, eventUrl,
    } = await req.json();

    if (!title || !date || !startTime) {
      return NextResponse.json({ error: "Title, date, and start time are required." }, { status: 400 });
    }

    const event = await db.event.create({
      data: {
        venueId: venue.id,
        title: title.trim(),
        description: description?.trim() || null,
        date: new Date(date),
        startTime,
        endTime: endTime || null,
        coverCharge: coverCharge != null && coverCharge !== "" ? parseFloat(String(coverCharge)) : null,
        imageUrl: imageUrl?.trim() || null,
        eventType: eventType?.trim() || null,
        category: category?.trim() || null,
        businessType: businessType?.trim() || null,
        experienceCategory: experienceCategory?.trim() || null,
        timingRestrictions: timingRestrictions?.trim() || null,
        groupFriendly: groupFriendly ?? false,
        incentiveHint: incentiveHint?.trim() || null,
        incentiveDesc: incentiveDesc?.trim() || null,
        eventUrl: eventUrl?.trim() || null,
      },
    });

    // Sync to DigitalOcean MySQL
    syncEventToMySQL(event, venue).catch((err) =>
      console.error("[mysql-sync] event POST sync failed:", err)
    );

    return NextResponse.json(event, { status: 201 });
  } catch (err) {
    console.error("[events POST] Error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
