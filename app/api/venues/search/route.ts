import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { searchClaimableVenues } from "@/lib/mysql-sync";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name")?.trim();
  const city = searchParams.get("city")?.trim();

  if (!name || name.length < 2) {
    return NextResponse.json({ error: "Name must be at least 2 characters." }, { status: 400 });
  }

  try {
    const venues = await searchClaimableVenues(name, city);
    return NextResponse.json(venues);
  } catch (err) {
    console.error("[venues/search] Error:", err);
    return NextResponse.json({ error: "Search failed." }, { status: 500 });
  }
}
