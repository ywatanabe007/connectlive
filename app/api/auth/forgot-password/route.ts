import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createResetToken } from "@/lib/password-reset";
import { sendEmail } from "@/lib/email";

// Always returns the same response so the endpoint can't be used to check
// which emails have accounts.
const GENERIC_OK = {
  ok: true,
  message: "If an account exists for that email, we've sent a link to reset your password.",
};

export async function POST(req: Request) {
  let email: unknown;
  try {
    ({ email } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  try {
    const user = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (user?.passwordHash) {
      const token = createResetToken(user);
      const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin).replace(/\/$/, "");
      const link = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;

      await sendEmail({
        to: user.email,
        subject: "Reset your ConnectLive password",
        text:
          `Hi${user.name ? ` ${user.name}` : ""},\n\n` +
          `We received a request to reset the password for your ConnectLive partner portal account.\n\n` +
          `Reset it here (link expires in 1 hour):\n${link}\n\n` +
          `If you didn't ask for this, you can ignore this email — your password won't change.`,
        html: `
          <div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#111">
            <h2 style="margin:0 0 16px">Reset your password</h2>
            <p>Hi${user.name ? ` ${escapeHtml(user.name)}` : ""},</p>
            <p>We received a request to reset the password for your ConnectLive partner portal account.</p>
            <p style="margin:28px 0">
              <a href="${link}" style="background:#9333ea;color:#fff;padding:12px 22px;border-radius:12px;text-decoration:none;font-weight:600">Reset password</a>
            </p>
            <p style="font-size:13px;color:#666">This link expires in 1 hour and can only be used once. If you didn't ask for this, you can ignore this email — your password won't change.</p>
          </div>`,
      });
    }
  } catch (err) {
    // Log but don't reveal anything to the caller.
    console.error("[forgot-password]", err);
  }

  return NextResponse.json(GENERIC_OK);
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
