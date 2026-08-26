import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: RouteParams) {
  await requireAdmin();
  const { id } = await params;
  const body = await req.json();

  const venue = await db.venue.update({
    where: { id },
    data: { active: body.active },
  });

  return NextResponse.json(venue);
}
