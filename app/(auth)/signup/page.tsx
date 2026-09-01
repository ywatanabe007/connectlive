"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, CheckCircle2, X } from "lucide-react";

type ClaimableVenue = {
  mysqlId: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string | null;
  website: string | null;
  imageUrl: string | null;
  description: string | null;
  businessType: string | null;
  experienceCategory: string | null;
  groupFriendly: boolean;
  lat: number | null;
  lng: number | null;
};

function SignupForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Venue search state
  const [searchName, setSearchName] = useState("");
  const [searchCity, setSearchCity] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ClaimableVenue[] | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<ClaimableVenue | null>(null);
  const [searchError, setSearchError] = useState("");

  const inputCls =
    "w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all";
  const inputStyle = { background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" };

  async function handleSearch() {
    if (searchName.trim().length < 2) {
      setSearchError("Please enter at least 2 characters.");
      return;
    }
    setSearching(true);
    setSearchError("");
    setSearchResults(null);
    try {
      const params = new URLSearchParams({ name: searchName.trim() });
      if (searchCity.trim()) params.set("city", searchCity.trim());
      const res = await fetch(`/api/venues/search?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSearchResults(data);
      if (data.length === 0) setSearchError("No venues found. You can still sign up and set up your venue manually.");
    } catch {
      setSearchError("Search failed. Please try again.");
    }
    setSearching(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }

    // 1. Create account (and claim venue server-side if one was selected)
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, mysqlId: selectedVenue?.mysqlId ?? null }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to create account. Please try again.");
      setLoading(false);
      return;
    }

    // 2. Auto sign-in
    const result = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    if (result?.error) {
      setError("Account created! Please sign in.");
      router.push("/login");
      return;
    }

    // 3. Navigate — venue claim already happened server-side during signup.
    //    Dashboard queries DB directly so it finds the venue immediately.
    //    If no venue was selected (or claim failed), dashboard redirects to /onboarding.
    window.location.href = selectedVenue ? "/dashboard" : "/onboarding";
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <img src="/logo.png" alt="ConnectLive" className="w-10 h-10 object-contain" />
            <span className="text-xl font-bold" style={{ color: "var(--fg)" }}>ConnectLive</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>Create your account</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            Start attracting guests to your venue today
          </p>
        </div>

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
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>Full name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                autoComplete="name"
                placeholder="Jane Smith"
                className={inputCls}
                style={inputStyle}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoComplete="email"
                placeholder="you@venue.com"
                className={inputCls}
                style={inputStyle}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                autoComplete="new-password"
                minLength={8}
                placeholder="8+ characters"
                className={inputCls}
                style={inputStyle}
              />
            </div>

            {/* Venue search section */}
            <div
              className="rounded-xl border p-4 space-y-3"
              style={{ borderColor: "var(--border)", background: "var(--bg)" }}
            >
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
                  Is your venue already on ConnectLive?
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                  Search to claim your existing profile and skip manual setup.
                </p>
              </div>

              {/* Show selected venue */}
              {selectedVenue ? (
                <div
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border border-emerald-300 bg-emerald-50"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-emerald-800 truncate">{selectedVenue.name}</p>
                      <p className="text-xs text-emerald-600 truncate">{selectedVenue.city}, {selectedVenue.state}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelectedVenue(null); setSearchResults(null); }}
                    className="text-emerald-600 hover:text-emerald-800 flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
                      placeholder="Venue name"
                      className="flex-1 px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                      style={inputStyle}
                    />
                    <input
                      type="text"
                      value={searchCity}
                      onChange={(e) => setSearchCity(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
                      placeholder="City"
                      className="w-28 px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                      style={inputStyle}
                    />
                    <button
                      type="button"
                      onClick={handleSearch}
                      disabled={searching}
                      className="px-3 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-50 flex-shrink-0"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                  </div>

                  {searchError && (
                    <p className="text-xs" style={{ color: "var(--muted)" }}>{searchError}</p>
                  )}

                  {searchResults && searchResults.length > 0 && (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {searchResults.map((v) => (
                        <div
                          key={v.mysqlId}
                          className="flex items-center justify-between gap-3 p-3 rounded-lg border cursor-pointer hover:border-purple-400 transition-colors"
                          style={{ borderColor: "var(--border)" }}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {v.imageUrl && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={v.imageUrl} alt={v.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate" style={{ color: "var(--fg)" }}>{v.name}</p>
                              <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{v.city}, {v.state}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => { setSelectedVenue(v); setSearchResults(null); }}
                            className="flex-shrink-0 px-3 py-1 rounded-lg text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors"
                          >
                            Select
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-fuchsia-500 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md mt-2"
            >
              {loading
                ? selectedVenue ? "Creating & claiming venue…" : "Creating account…"
                : selectedVenue ? "Create account & claim venue" : "Create free account"}
            </button>
          </form>

          <p className="mt-4 text-xs text-center" style={{ color: "var(--muted)" }}>
            By signing up you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>

        <p className="text-center mt-6 text-sm" style={{ color: "var(--muted)" }}>
          Already have an account?{" "}
          <Link href="/login" className="text-purple-600 hover:text-purple-700 font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
