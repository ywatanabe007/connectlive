import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";

export async function GET() {
  await requireAdmin();

  const incentives = await db.incentive.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      venue: { select: { id: true, name: true, city: true, state: true } },
      _count: { select: { redemptions: true } },
    },
  });

  return NextResponse.json({ incentives });
}
