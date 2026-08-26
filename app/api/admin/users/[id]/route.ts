import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: RouteParams) {
  await requireAdmin();
  const { id } = await params;
  const { role } = await req.json();

  const allowed = ["USER", "VENUE_OWNER", "ADMIN"];
  if (!allowed.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const user = await db.user.update({ where: { id }, data: { role } });
  return NextResponse.json(user);
}
