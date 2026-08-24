import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { geocodeAddress } from "@/lib/geo";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const venue = await db.venue.findUnique({ where: { ownerId: session.user.id } });
  if (!venue) {
    return NextResponse.json({ error: "Venue not found" }, { status: 404 });
  }

  return NextResponse.json(venue);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if venue already exists for this user
  const existing = await db.venue.findUnique({ where: { ownerId: session.user.id } });
  if (existing) {
    return NextResponse.json({ error: "Venue already exists for this account." }, { status: 409 });
  }

  try {
    const { name, type, address, city, state, zip, phone, website, description } =
      await req.json();

    if (!name || !type || !address || !city || !state || !zip) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // Geocode the address
    const { lat, lng } = await geocodeAddress(address, city, state, zip);

    const venue = await db.venue.create({
      data: {
        ownerId: session.user.id,
        name: name.trim(),
        type,
        address: address.trim(),
        city: city.trim(),
        state: state.trim().toUpperCase(),
        zip: zip.trim(),
        phone: phone?.trim() || null,
        website: website?.trim() || null,
        description: description?.trim() || null,
        lat,
        lng,
      },
    });

    // Upgrade user role to VENUE_OWNER
    await db.user.update({
      where: { id: session.user.id },
      data: { role: "VENUE_OWNER" },
    });

    return NextResponse.json(venue, { status: 201 });
  } catch (err) {
    console.error("[venues/mine POST] Error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const venue = await db.venue.findUnique({ where: { ownerId: session.user.id } });
  if (!venue) {
    return NextResponse.json({ error: "Venue not found" }, { status: 404 });
  }

  try {
    const body = await req.json();

    // Strip non-updatable fields
    const { ownerId: _o, id: _i, createdAt: _c, ...updateData } = body;

    // Re-geocode if any address field changed
    const addressFields = ["address", "city", "state", "zip"];
    const addressChanged = addressFields.some((f) => updateData[f] !== undefined);

    if (addressChanged) {
      const { lat, lng } = await geocodeAddress(
        updateData.address ?? venue.address,
        updateData.city ?? venue.city,
        updateData.state ?? venue.state,
        updateData.zip ?? venue.zip
      );
      updateData.lat = lat;
      updateData.lng = lng;
    }

    const updated = await db.venue.update({
      where: { id: venue.id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[venues/mine PATCH] Error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
