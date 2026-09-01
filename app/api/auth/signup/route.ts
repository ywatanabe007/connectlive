import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getPool, markVenueAsClaimed } from "@/lib/mysql-sync";

const VENUE_TABLE = process.env.MYSQL_VENUE_TABLE ?? "tbl_venues";

export async function POST(req: Request) {
  try {
    const { name, email, password, mysqlId } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with that email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        name: name?.trim() || null,
      },
    });

    // If a venue was selected during signup, claim it now while we have the
    // user id on the server. This avoids the session-cookie timing race that
    // occurred when the claim was attempted immediately after signIn() on the
    // client.
    if (mysqlId) {
      try {
        const pool = getPool();
        const [rows] = await pool.execute<any[]>(
          `SELECT * FROM \`${VENUE_TABLE}\` WHERE id = ? LIMIT 1`,
          [mysqlId]
        );
        const r = rows[0];

        if (!r) {
          console.error(`[signup] MySQL row not found for mysqlId=${mysqlId}`);
          return NextResponse.json(
            { id: user.id, email: user.email, venueClaimed: false, claimError: `MySQL row not found for id=${mysqlId}` },
            { status: 201 }
          );
        }
        if (r) {
          const venueName        = (r.event_title ?? r.location_name ?? r.name ?? "").trim();
          const address          = (r.address ?? r.street_address ?? "").trim();
          const city             = (r.city ?? "").trim();
          const state            = (r.state ?? "").trim().toUpperCase();
          const zip              = (r.zip_code ?? r.zip ?? r.postal_code ?? "").trim();
          const phone            = (r.phone ?? r.phone_number ?? null)?.trim() || null;
          const website          = (r.event_url ?? r.website ?? r.url ?? null)?.trim() || null;
          const imageUrl         = (r.image_url ?? r.photo_url ?? r.cover_image ?? null)?.trim() || null;
          const description      = (r.description ?? r.about ?? null)?.trim() || null;
          const businessType     = (r.business_type ?? r.type ?? null) || null;
          const experienceCategory = (r.experience_category ?? r.category ?? null) || null;
          const groupFriendly    = r.group_friendly === "Yes" || r.group_friendly === 1 || r.group_friendly === true;
          const lat = typeof r.latitude === "number" ? r.latitude : typeof r.lat === "number" ? r.lat : 0;
          const lng = typeof r.longitude === "number" ? r.longitude : typeof r.lng === "number" ? r.lng : typeof r.lon === "number" ? r.lon : 0;

          if (!venueName || !address || !city || !state) {
            console.error(`[signup] Missing required venue fields: name=${venueName} address=${address} city=${city} state=${state}`);
            return NextResponse.json(
              { id: user.id, email: user.email, venueClaimed: false, claimError: `Missing fields: name=${venueName} addr=${address} city=${city} state=${state}` },
              { status: 201 }
            );
          }
          if (venueName && address && city && state) {
            const venue = await db.venue.create({
              data: {
                ownerId: user.id,
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
              },
            });

            // Import incentives
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
                console.error("[signup] Failed to import incentives_json:", err);
              }
            }

            // Upgrade role and mark MySQL row as claimed
            await db.user.update({ where: { id: user.id }, data: { role: "VENUE_OWNER" } });
            await markVenueAsClaimed(mysqlId, venue.id);

            return NextResponse.json(
              { id: user.id, email: user.email, venueClaimed: true },
              { status: 201 }
            );
          }
        }
      } catch (err: any) {
        console.error("[signup] Venue claim failed, user created without venue:", err);
        return NextResponse.json(
          { id: user.id, email: user.email, venueClaimed: false, claimError: err?.message ?? String(err) },
          { status: 201 }
        );
      }
    }

    return NextResponse.json({ id: user.id, email: user.email, venueClaimed: false }, { status: 201 });
  } catch (err) {
    console.error("[signup] Error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
