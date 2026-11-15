"use client";

import { useState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
    setLoading(false);
  }

  const inputCls =
    "w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all";

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <img src="/logo.png" alt="ConnectLive" className="w-10 h-10 object-contain" />
            <span className="text-xl font-bold" style={{ color: "var(--fg)" }}>ConnectLive</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>Forgot your password?</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            Enter your email and we&apos;ll send you a link to reset it.
          </p>
        </div>

        <div className="rounded-2xl p-8 border shadow-sm" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          {sent ? (
            <div className="text-center space-y-3">
              <MailCheck className="w-10 h-10 mx-auto text-emerald-500" />
              <p className="text-sm" style={{ color: "var(--fg)" }}>
                If an account exists for <strong>{email}</strong>, we&apos;ve sent a link to reset your password.
              </p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                The link expires in 1 hour. Check your spam folder if you don&apos;t see it.
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="you@venue.com"
                    className={inputCls}
                    style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-fuchsia-500 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md mt-2"
                >
                  {loading ? "Sending…" : "Send reset link"}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center mt-6 text-sm" style={{ color: "var(--muted)" }}>
          Remembered it?{" "}
          <Link href="/login" className="text-purple-600 hover:text-purple-700 font-semibold">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
