import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { geocodeAddress } from "@/lib/geo";
import { syncVenueToMySQL } from "@/lib/mysql-sync";

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

  const existing = await db.venue.findUnique({ where: { ownerId: session.user.id } });
  if (existing) {
    return NextResponse.json({ error: "Venue already exists for this account." }, { status: 409 });
  }

  try {
    const {
      name, type, businessType, experienceCategory,
      address, city, state, zip,
      phone, website, imageUrl, description,
      groupFriendly, timeZone, businessHours,
    } = await req.json();

    if (!name || !address || !city || !state || !zip) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const { lat, lng } = await geocodeAddress(address, city, state, zip);

    const venue = await db.venue.create({
      data: {
        ownerId: session.user.id,
        name: name.trim(),
        type: businessType || type || "",
        businessType: businessType || type || null,
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
        timeZone: timeZone || null,
        businessHours: businessHours || null,
        lat,
        lng,
      },
    });

    await db.user.update({
      where: { id: session.user.id },
      data: { role: "VENUE_OWNER" },
    });

    // Sync to mobile app MySQL (non-blocking — don't fail the request if sync fails)
    syncVenueToMySQL({ ...venue, businessHours: venue.businessHours as any }).catch((err) =>
      console.error("[mysql-sync] venue POST sync failed:", err)
    );

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
    const { ownerId: _o, id: _i, createdAt: _c, ...updateData } = body;

    // Keep type in sync with businessType
    if (updateData.businessType) {
      updateData.type = updateData.businessType;
    }

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

    // Fetch incentives so the sync includes the latest set
    const incentives = await db.incentive.findMany({
      where: { venueId: venue.id },
    });

    // Sync to mobile app MySQL
    try {
      await syncVenueToMySQL({
        ...updated,
        businessHours: updated.businessHours as any,
        incentives: incentives as any,
      });
    } catch (err) {
      console.error("[mysql-sync] venue PATCH sync failed:", err);
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[venues/mine PATCH] Error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
