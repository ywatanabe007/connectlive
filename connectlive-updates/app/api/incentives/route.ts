import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

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

  const incentives = await db.incentive.findMany({
    where: { venueId: venue.id },
    include: { _count: { select: { redemptions: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    incentives.map((i) => ({ ...i, redemptionCount: i._count.redemptions }))
  );
}

export async function POST(req: Request) {
  const { session, venue } = await getVenueForSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!venue) return NextResponse.json({ error: "No venue found" }, { status: 404 });

  try {
    const {
      title, description, teaserText, category,
      validTimes, startAt, endAt,
      maxRedemptions, terms, groupFriendly,
    } = await req.json();

    if (!title || !description || !category || !startAt || !endAt) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const start = new Date(startAt);
    const end = new Date(endAt);

    if (end <= start) {
      return NextResponse.json(
        { error: "End date must be after start date." },
        { status: 400 }
      );
    }

    const incentive = await db.incentive.create({
      data: {
        venueId: venue.id,
        title: title.trim(),
        description: description.trim(),
        teaserText: teaserText?.trim() || null,
        category,
        validTimes: validTimes?.trim() || null,
        startAt: start,
        endAt: end,
        maxRedemptions: maxRedemptions ? parseInt(String(maxRedemptions)) : null,
        terms: terms?.trim() || null,
        groupFriendly: groupFriendly ?? false,
      },
    });

    return NextResponse.json(incentive, { status: 201 });
  } catch (err) {
    console.error("[incentives POST] Error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
