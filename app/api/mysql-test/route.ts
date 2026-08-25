import { NextResponse } from "next/server";
import { auth } from "@/auth";
import mysql from "mysql2/promise";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = {
    host: process.env.MYSQL_HOST,
    port: parseInt(process.env.MYSQL_PORT ?? "25060"),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD ? "***set***" : "NOT SET",
    database: process.env.MYSQL_DATABASE,
    table: process.env.MYSQL_VENUE_TABLE,
  };

  // Check env vars first
  if (!process.env.MYSQL_HOST || !process.env.MYSQL_USER || !process.env.MYSQL_PASSWORD || !process.env.MYSQL_DATABASE) {
    return NextResponse.json({
      status: "error",
      message: "Missing environment variables",
      config,
    });
  }

  try {
    const conn = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      port: parseInt(process.env.MYSQL_PORT ?? "25060"),
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      ssl: { rejectUnauthorized: true },
      connectTimeout: 8000,
    });

    // Test connection + check table exists
    const [rows] = await conn.execute(
      `SELECT COUNT(*) as count FROM \`${process.env.MYSQL_VENUE_TABLE}\` LIMIT 1`
    );
    await conn.end();

    return NextResponse.json({
      status: "ok",
      message: "Connected successfully",
      table: process.env.MYSQL_VENUE_TABLE,
      rowCount: (rows as any)[0].count,
      config: { ...config, password: "***set***" },
    });
  } catch (err: any) {
    return NextResponse.json({
      status: "error",
      message: err.message,
      code: err.code,
      config: { ...config, password: "***set***" },
    });
  }
}
