/**
 * POST /api/venues/claim-onboarding
 *
 * Lets an already-authenticated user (who skipped venue search at signup and
 * is now in the onboarding flow) claim an existing MySQL venue that matches
 * their address.  On success the user is redirected to /dashboard.
 *
 * Body: { mysqlId: number }
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getPool, markVenueAsClaimed } from "@/lib/mysql-sync";

const VENUE_TABLE = process.env.MYSQL_VENUE_TABLE ?? "tbl_venues_near_you_staging";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const mysqlId = Number(body.mysqlId);
  if (!mysqlId) {
    return NextResponse.json({ error: "mysqlId is required." }, { status: 400 });
  }

  // Prevent claiming a second venue
  const existing = await db.venue.findUnique({ where: { ownerId: session.user.id } });
  if (existing) {
    return NextResponse.json({ error: "You already have a venue." }, { status: 409 });
  }

  try {
    const pool = getPool();
    const [rows] = await pool.execute<any[]>(
      `SELECT * FROM \`${VENUE_TABLE}\` WHERE id = ? LIMIT 1`,
      [mysqlId]
    );
    const r = rows[0];

    if (!r) {
      return NextResponse.json({ error: "Venue not found in database." }, { status: 404 });
    }
    if (r.source === "partner_portal") {
      return NextResponse.json({ error: "This venue has already been claimed." }, { status: 409 });
    }

    const venueName = ((r.event_title ?? r.location_name ?? r.name ?? "") as string).trim();
    const address   = ((r.address ?? r.street_address ?? "") as string).trim();
    const city      = ((r.city ?? "") as string).trim();
    const state     = ((r.state ?? "") as string).trim().toUpperCase();
    const zip       = ((r.zip_code ?? r.zip ?? r.postal_code ?? "") as string).trim();
    const phone     = ((r.phone ?? r.phone_number ?? null) as string | null)?.trim() || null;
    const website   = ((r.event_url ?? r.website ?? r.url ?? null) as string | null)?.trim() || null;
    const imageUrl  = ((r.image_url ?? r.photo_url ?? r.cover_image ?? null) as string | null)?.trim() || null;
    const description = ((r.description ?? r.about ?? null) as string | null)?.trim() || null;
    const businessType = ((r.business_type ?? r.event_type ?? r.type ?? null) as string | null) || null;
    const experienceCategory = ((r.experience_category ?? r.category ?? null) as string | null) || null;
    const groupFriendly = r.group_friendly === "Yes" || r.group_friendly === 1 || r.group_friendly === true;
    const lat = typeof r.latitude === "number" ? r.latitude : typeof r.lat === "number" ? r.lat : 0;
    const lng = typeof r.longitude === "number" ? r.longitude
              : typeof r.lng === "number" ? r.lng
              : typeof r.lon === "number" ? r.lon : 0;

    if (!venueName || !address || !city || !state) {
      return NextResponse.json(
        { error: `Cannot claim — missing fields: name=${venueName} addr=${address} city=${city} state=${state}` },
        { status: 422 }
      );
    }

    // Create the venue in Neon (auth layer)
    const venue = await db.venue.create({
      data: {
        ownerId: session.user.id,
        name: venueName,
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
        businessHours: r.operating_hours
          ? (() => {
              try {
                return typeof r.operating_hours === "string"
                  ? JSON.parse(r.operating_hours)
                  : r.operating_hours;
              } catch {
                return null;
              }
            })()
          : null,
      },
    });

    // Import incentives from incentives_json
    const incentivesRaw = r.incentives_json;
    if (incentivesRaw) {
      try {
        const parsed =
          typeof incentivesRaw === "string" ? JSON.parse(incentivesRaw) : incentivesRaw;
        const arr: any[] = Array.isArray(parsed) ? parsed : [parsed];
        const now = new Date();
        const farFuture = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

        for (const i of arr) {
          const title = ((i.title ?? "") as string).trim();
          const desc  = ((i.incentives ?? i.description ?? "") as string).trim();
          if (!title || !desc) continue;
          const startAt = i.start_date ? new Date(i.start_date) : now;
          const endAt   = i.end_date   ? new Date(i.end_date)   : farFuture;
          await db.incentive.create({
            data: {
              venueId:         venue.id,
              title,
              description:     desc,
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
        console.error("[claim-onboarding] Failed to import incentives_json:", err);
      }
    }

    // Upgrade user role and mark the MySQL row as claimed
    await db.user.update({ where: { id: session.user.id }, data: { role: "VENUE_OWNER" } });
    await markVenueAsClaimed(mysqlId, venue.id);

    return NextResponse.json({ success: true, venueId: venue.id }, { status: 201 });
  } catch (err: any) {
    console.error("[claim-onboarding] Error:", err);
    return NextResponse.json({ error: err.message ?? "Claim failed." }, { status: 500 });
  }
}
