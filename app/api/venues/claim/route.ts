import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getPool, markVenueAsClaimed } from "@/lib/mysql-sync";

const VENUE_TABLE = process.env.MYSQL_VENUE_TABLE ?? "tbl_venues";

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
    const body = await req.json();
    const { mysqlId } = body;

    if (!mysqlId) {
      return NextResponse.json({ error: "Missing mysqlId." }, { status: 400 });
    }

    // Re-fetch the full MySQL row so we get every column including incentives_json
    const pool = getPool();
    const [rows] = await pool.execute<any[]>(
      `SELECT * FROM \`${VENUE_TABLE}\` WHERE id = ? LIMIT 1`,
      [mysqlId]
    );
    const r = rows[0];
    if (!r) {
      return NextResponse.json({ error: "Venue not found in database." }, { status: 404 });
    }

    // Defensive field mapping — handle various column naming conventions the scraper may use
    const name        = (r.event_title ?? r.location_name ?? r.name ?? body.name ?? "").trim();
    const address     = (r.address ?? r.street_address ?? body.address ?? "").trim();
    const city        = (r.city ?? body.city ?? "").trim();
    const state       = (r.state ?? body.state ?? "").trim().toUpperCase();
    const zip         = (r.zip_code ?? r.zip ?? r.postal_code ?? body.zip ?? "").trim();
    const phone       = (r.phone ?? r.phone_number ?? body.phone ?? null)?.trim() || null;
    const website     = (r.event_url ?? r.website ?? r.url ?? body.website ?? null)?.trim() || null;
    const imageUrl    = (r.image_url ?? r.photo_url ?? r.cover_image ?? body.imageUrl ?? null)?.trim() || null;
    const description = (r.description ?? r.about ?? body.description ?? null)?.trim() || null;
    const businessType       = (r.business_type ?? r.event_type ?? r.type ?? body.businessType ?? null) || null;
    const experienceCategory = (r.experience_category ?? r.category ?? body.experienceCategory ?? null) || null;
    const groupFriendly      = r.group_friendly === "Yes" || r.group_friendly === 1 || r.group_friendly === true || body.groupFriendly === true;
    const lat = typeof r.latitude === "number" ? r.latitude : typeof r.lat === "number" ? r.lat : (body.lat ?? 0);
    const lng = typeof r.longitude === "number" ? r.longitude : typeof r.lng === "number" ? r.lng : typeof r.lon === "number" ? r.lon : (body.lng ?? 0);
    const businessHours = r.operating_hours
      ? (() => { try { return typeof r.operating_hours === "string" ? JSON.parse(r.operating_hours) : r.operating_hours; } catch { return null; } })()
      : null;

    if (!name || !address || !city || !state) {
      return NextResponse.json({ error: "Missing required venue fields." }, { status: 400 });
    }

    // Create the venue in Neon
    const venue = await db.venue.create({
      data: {
        ownerId: session.user.id,
        name,
        type: businessType || "",
        businessType: businessType || null,
        experienceCategory: experienceCategory || null,
        address,
        city,
        state,
        zip,
        phone,
        website,
        imageUrl,
        description,
        groupFriendly,
        lat,
        lng,
        businessHours,
      },
    });

    // Import incentives from incentives_json if present
    const incentivesRaw = r.incentives_json;
    if (incentivesRaw) {
      try {
        const incentives: any[] = typeof incentivesRaw === "string"
          ? JSON.parse(incentivesRaw)
          : incentivesRaw;

        const now = new Date();
        const farFuture = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

        for (const i of incentives) {
          const title       = (i.title ?? "").trim();
          const description = (i.incentives ?? i.description ?? "").trim();
          if (!title || !description) continue;

          const startAt = i.start_date ? new Date(i.start_date) : now;
          const endAt   = i.end_date   ? new Date(i.end_date)   : farFuture;

          await db.incentive.create({
            data: {
              venueId:         venue.id,
              title,
              description,
              teaserText:      i.incentive_hint ?? i.teaser ?? null,
              category:        i.type ?? i.category ?? "Other",
              validTimes:      i.schedule ?? null,
              recurrence:      i.recurrence ?? "ONE_TIME",
              startAt:         isNaN(startAt.getTime()) ? now : startAt,
              endAt:           isNaN(endAt.getTime())   ? farFuture : endAt,
              maxRedemptions:  i.max_redemptions ?? null,
              redemptionCount: i.redemption_count ?? 0,
              groupFriendly:   i.group_friendly === "Yes" || i.group_friendly === true,
              terms:           i.terms ?? null,
              status:          "ACTIVE",
            },
          });
        }
      } catch (err) {
        console.error("[venues/claim] Failed to import incentives_json:", err);
      }
    }

    // If no incentives_json array, fall back to top-level incentive fields
    if (!incentivesRaw && r.incentives) {
      const singleDesc = (r.incentives ?? "").trim();
      if (singleDesc) {
        const now2 = new Date();
        const farFuture2 = new Date(now2.getFullYear() + 1, now2.getMonth(), now2.getDate());
        try {
          await db.incentive.create({
            data: {
              venueId:         venue.id,
              title:           name || "Special Offer",
              description:     singleDesc,
              teaserText:      (r.incentive_hint ?? null)?.trim() || null,
              category:        r.category ?? r.event_type ?? "Other",
              validTimes:      null,
              recurrence:      "ONE_TIME",
              startAt:         now2,
              endAt:           farFuture2,
              maxRedemptions:  null,
              redemptionCount: 0,
              groupFriendly:   false,
              terms:           null,
              status:          "ACTIVE",
            },
          });
        } catch (err) {
          console.error("[venues/claim] Failed to create single incentive from top-level fields:", err);
        }
      }
    }

    // Upgrade user role to VENUE_OWNER
    await db.user.update({
      where: { id: session.user.id },
      data: { role: "VENUE_OWNER" },
    });

    // Mark the MySQL row as claimed
    await markVenueAsClaimed(mysqlId, venue.id);

    return NextResponse.json(venue, { status: 201 });
  } catch (err) {
    console.error("[venues/claim POST] Error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
