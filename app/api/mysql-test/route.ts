import { NextResponse } from "next/server";
import { auth } from "@/auth";
import mysql from "mysql2/promise";
import tls from "tls";

// Test raw TLS connection independently of mysql2
function testRawTls(): Promise<string> {
  return new Promise((resolve) => {
    try {
      const socket = tls.connect(
        {
          host: process.env.MYSQL_HOST!,
          port: parseInt(process.env.MYSQL_PORT ?? "25060"),
          rejectUnauthorized: false,
        },
        () => {
          const peer = socket.getPeerCertificate();
          socket.destroy();
          resolve(`TLS OK — peer CN: ${peer?.subject?.CN ?? "unknown"}`);
        }
      );
      socket.setTimeout(8000, () => {
        socket.destroy();
        resolve("TLS timeout after 8s");
      });
      socket.on("error", (err: any) => resolve(`TLS error: ${err.message} (${err.code})`));
    } catch (err: any) {
      resolve(`TLS threw: ${err.message}`);
    }
  });
}

function getSslConfig(): object {
  if (process.env.MYSQL_CA_CERT) {
    return {
      ca: Buffer.from(process.env.MYSQL_CA_CERT, "base64").toString("utf8"),
      rejectUnauthorized: false,
    };
  }
  return { rejectUnauthorized: false };
}

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
    caProvided: !!process.env.MYSQL_CA_CERT,
  };

  if (!process.env.MYSQL_HOST || !process.env.MYSQL_USER || !process.env.MYSQL_PASSWORD || !process.env.MYSQL_DATABASE) {
    return NextResponse.json({ status: "error", message: "Missing environment variables", config });
  }

  // Step 1: test raw TLS before even trying mysql2
  const tlsResult = await testRawTls();

  try {
    const conn = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      port: parseInt(process.env.MYSQL_PORT ?? "25060"),
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      ssl: getSslConfig(),
      connectTimeout: 10000,
    });

    const [rows] = await conn.execute(
      `SELECT COUNT(*) as count FROM \`${process.env.MYSQL_VENUE_TABLE}\` LIMIT 1`
    );
    await conn.end();

    return NextResponse.json({
      status: "ok",
      message: "Connected successfully",
      tlsTest: tlsResult,
      table: process.env.MYSQL_VENUE_TABLE,
      rowCount: (rows as any)[0].count,
      config,
    });
  } catch (err: any) {
    return NextResponse.json({
      status: "error",
      message: err.message,
      code: err.code,
      tlsTest: tlsResult,
      config,
    });
  }
}
