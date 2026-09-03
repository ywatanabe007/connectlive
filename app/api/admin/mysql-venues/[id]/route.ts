import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getPool } from "@/lib/mysql-sync";

const VENUE_TABLE = process.env.MYSQL_VENUE_TABLE ?? "tbl_venues";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: RouteParams) {
  await requireAdmin();
  const { id } = await params;
  const body = await req.json();

  const allowed = [
    "event_title", "location_name", "address", "city", "state", "zip_code",
    "phone", "event_url", "image_url", "description",
    "business_type", "experience_category", "group_friendly",
    "incentives", "incentive_hint",
  ] as const;

  const sets: string[] = [];
  const values: unknown[] = [];

  for (const col of allowed) {
    if (body[col] !== undefined) {
      sets.push(`\`${col}\` = ?`);
      values.push(body[col] ?? null);
    }
  }

  if (!sets.length) {
    return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
  }

  sets.push("`date_updated` = ?");
  values.push(new Date());
  values.push(id); // WHERE id = ?

  try {
    const pool = getPool();
    const [result] = await pool.execute(
      `UPDATE \`${VENUE_TABLE}\` SET ${sets.join(", ")} WHERE id = ?`,
      values
    ) as any;

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Venue not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[admin/mysql-venues PATCH] Error:", err);
    return NextResponse.json({ error: err.message ?? "Update failed." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  await requireAdmin();
  const { id } = await params;

  try {
    const pool = getPool();
    const [result] = await pool.execute(
      `DELETE FROM \`${VENUE_TABLE}\` WHERE id = ?`,
      [id]
    ) as any;

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Venue not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[admin/mysql-venues DELETE] Error:", err);
    return NextResponse.json({ error: err.message ?? "Delete failed." }, { status: 500 });
  }
}
