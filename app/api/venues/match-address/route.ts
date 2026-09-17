import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPool } from "@/lib/mysql-sync";

const VENUE_TABLE = process.env.MYSQL_VENUE_TABLE ?? "tbl_venues_near_you_staging";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address")?.trim() ?? "";
  const city    = searchParams.get("city")?.trim()    ?? "";
  const state   = searchParams.get("state")?.trim()   ?? "";

  // Need at least address + city + state to do a meaningful match
  if (address.length < 4 || city.length < 2 || state.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const pool = getPool();

    // Extract first two tokens from address for a partial match
    // e.g. "123 Main St Ste 4" → "123 Main"
    const addressPrefix = address.split(/\s+/).slice(0, 2).join(" ");

    const [rows] = await pool.execute<any[]>(
      `SELECT id, event_title, location_name, address, city, state, zip_code,
              image_url, business_type, experience_category, group_friendly,
              latitude, longitude, event_url, description, incentives_json
       FROM \`${VENUE_TABLE}\`
       WHERE (source IS NULL OR source != 'partner_portal')
         AND city LIKE ?
         AND state = ?
         AND (address LIKE ? OR address LIKE ?)
       LIMIT 5`,
      [
        `%${city}%`,
        state.toUpperCase(),
        `%${addressPrefix}%`,
        `%${address}%`,
      ]
    );

    return NextResponse.json(
      rows.map((r) => ({
        mysqlId:            r.id as number,
        name:               ((r.event_title ?? r.location_name ?? "") as string).trim(),
        address:            ((r.address ?? "") as string).trim(),
        city:               ((r.city ?? "") as string).trim(),
        state:              ((r.state ?? "") as string).trim(),
        zip:                ((r.zip_code ?? "") as string).trim(),
        imageUrl:           (r.image_url ?? null) as string | null,
        businessType:       (r.business_type ?? null) as string | null,
        experienceCategory: (r.experience_category ?? null) as string | null,
        groupFriendly:      r.group_friendly === "Yes" || r.group_friendly === 1,
        lat:                (r.latitude ?? r.lat ?? null) as number | null,
        lng:                (r.longitude ?? r.lng ?? null) as number | null,
        website:            (r.event_url ?? null) as string | null,
        description:        (r.description ?? null) as string | null,
      }))
    );
  } catch (err: any) {
    console.error("[match-address] Error:", err);
    // Fail silently — we don't want an address lookup error to block onboarding
    return NextResponse.json([]);
  }
}
