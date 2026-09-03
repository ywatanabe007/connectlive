import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";

export async function GET() {
  await requireAdmin();

  const venues = await db.venue.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      owner: { select: { email: true } },
      _count: { select: { incentives: true, events: true } },
    },
  });

  return NextResponse.json({ venues });
}
