import { createHmac, timingSafeEqual } from "crypto";
import { db } from "@/lib/db";

/**
 * Stateless password-reset tokens.
 *
 * Token = base64url(JSON{ uid, exp }) + "." + HMAC-SHA256 signature.
 * The signature is keyed with AUTH_SECRET and also covers the user's current
 * password hash, so a token stops working as soon as the password changes
 * (single use) — no extra database table needed.
 */

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function secret(): string {
  const s = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return s;
}

function sign(payloadB64: string, passwordHash: string): string {
  return createHmac("sha256", secret())
    .update(`${payloadB64}.${passwordHash}`)
    .digest("base64url");
}

export function createResetToken(user: { id: string; passwordHash: string }): string {
  const payload = { uid: user.id, exp: Date.now() + TOKEN_TTL_MS };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${payloadB64}.${sign(payloadB64, user.passwordHash)}`;
}

/** Returns the user the token belongs to, or null if invalid, expired or already used. */
export async function verifyResetToken(token: string) {
  if (typeof token !== "string") return null;
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return null;

  let payload: { uid?: unknown; exp?: unknown };
  try {
    payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (typeof payload.uid !== "string" || typeof payload.exp !== "number") return null;
  if (Date.now() > payload.exp) return null;

  const user = await db.user.findUnique({ where: { id: payload.uid } });
  if (!user?.passwordHash) return null;

  const expected = Buffer.from(sign(payloadB64, user.passwordHash));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  return user;
}
