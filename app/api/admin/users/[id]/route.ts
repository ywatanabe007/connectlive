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

export async function DELETE(_req: Request, { params }: RouteParams) {
  await requireAdmin();
  const { id } = await params;

  const user = await db.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
