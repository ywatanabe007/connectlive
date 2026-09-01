import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { markVenueAsClaimed } from "@/lib/mysql-sync";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await db.venue.findUnique({ where: { ownerId: session.user.id } });
  if (existing) {
    return NextResponse.json({ error: "Venue already exists for this account." }, { status: 409 });
  }

  try {
    const {
      mysqlId,
      name,
      address,
      city,
      state,
      zip,
      phone,
      website,
      imageUrl,
      description,
      businessType,
      experienceCategory,
      groupFriendly,
      lat,
      lng,
    } = await req.json();

    if (!mysqlId || !name || !address || !city || !state || !zip) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // Use coordinates from MySQL if available, otherwise fall back to 0
    const venueLat = typeof lat === "number" && lat !== 0 ? lat : 0;
    const venueLng = typeof lng === "number" && lng !== 0 ? lng : 0;

    // Create the venue in Neon pre-filled from MySQL data
    const venue = await db.venue.create({
      data: {
        ownerId: session.user.id,
        name: name.trim(),
        type: businessType || "",
        businessType: businessType || null,
        experienceCategory: experienceCategory || null,
        address: address.trim(),
        city: city.trim(),
        state: state.trim().toUpperCase(),
        zip: zip.trim(),
        phone: phone?.trim() || null,
        website: website?.trim() || null,
        imageUrl: imageUrl?.trim() || null,
        description: description?.trim() || null,
        groupFriendly: groupFriendly ?? false,
        lat: venueLat,
        lng: venueLng,
      },
    });

    // Upgrade user role to VENUE_OWNER
    await db.user.update({
      where: { id: session.user.id },
      data: { role: "VENUE_OWNER" },
    });

    // Mark the MySQL row as claimed — flip source + set source_event_id to our portal ID
    await markVenueAsClaimed(mysqlId, venue.id);

    return NextResponse.json(venue, { status: 201 });
  } catch (err) {
    console.error("[venues/claim POST] Error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
