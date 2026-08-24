import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

/**
 * GET /api/redemptions
 * Returns aggregate redemption stats for the current venue owner.
 *
 * POST /api/redemptions
 * Records a redemption (called by the ConnectLive mobile app on behalf of an end user).
 * Body: { incentiveId: string, userId: string }
 */

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const venue = await db.venue.findUnique({
    where: { ownerId: session.user.id },
    include: {
      incentives: {
        include: { redemptions: true },
      },
    },
  });

  if (!venue) return NextResponse.json({ error: "No venue found" }, { status: 404 });

  const total = venue.incentives.reduce((sum, i) => sum + i.redemptions.length, 0);

  const byIncentive = venue.incentives.map((i) => ({
    id: i.id,
    title: i.title,
    category: i.category,
    redemptions: i.redemptions.length,
  }));

  return NextResponse.json({ total, byIncentive });
}

export async function POST(req: Request) {
  try {
    const { incentiveId, userId } = await req.json();

    if (!incentiveId || !userId) {
      return NextResponse.json(
        { error: "incentiveId and userId are required." },
        { status: 400 }
      );
    }

    const incentive = await db.incentive.findUnique({ where: { id: incentiveId } });
    if (!incentive) {
      return NextResponse.json({ error: "Incentive not found." }, { status: 404 });
    }

    // Check if still active
    const now = new Date();
    if (now < incentive.startAt || now > incentive.endAt) {
      return NextResponse.json({ error: "Incentive is not currently active." }, { status: 422 });
    }

    if (incentive.status !== "ACTIVE") {
      return NextResponse.json({ error: "Incentive is paused or expired." }, { status: 422 });
    }

    // Check max redemptions
    if (incentive.maxRedemptions !== null) {
      const count = await db.redemption.count({ where: { incentiveId } });
      if (count >= incentive.maxRedemptions) {
        // Auto-expire
        await db.incentive.update({
          where: { id: incentiveId },
          data: { status: "EXPIRED" },
        });
        return NextResponse.json({ error: "Incentive is fully redeemed." }, { status: 422 });
      }
    }

    const redemption = await db.redemption.create({
      data: { incentiveId, userId },
    });

    // Update denormalized count
    await db.incentive.update({
      where: { id: incentiveId },
      data: { redemptionCount: { increment: 1 } },
    });

    return NextResponse.json(redemption, { status: 201 });
  } catch (err) {
    console.error("[redemptions POST] Error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
