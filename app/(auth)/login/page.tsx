"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

function Logo() {
  return (
    <div className="text-center mb-8">
      <div className="inline-flex items-center gap-2.5 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C3AED] via-[#D946EF] to-[#F97316] flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-sm tracking-tight">CL</span>
        </div>
        <span className="text-xl font-bold" style={{ color: "var(--fg)" }}>ConnectLive</span>
      </div>
      <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>Welcome back</h1>
      <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>Sign in to your partner portal</p>
    </div>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password. Please try again.");
      setLoading(false);
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  const inputCls =
    "w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all";

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--bg)" }}
    >
      <div className="w-full max-w-md">
        <Logo />

        <div
          className="rounded-2xl p-8 border shadow-sm"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--fg)" }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@venue.com"
                className={inputCls}
                style={{
                  background: "var(--bg)",
                  borderColor: "var(--border)",
                  color: "var(--fg)",
                }}
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--fg)" }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className={inputCls}
                style={{
                  background: "var(--bg)",
                  borderColor: "var(--border)",
                  color: "var(--fg)",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-fuchsia-500 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md mt-2"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm" style={{ color: "var(--muted)" }}>
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-purple-600 hover:text-purple-700 font-semibold"
          >
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
