import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const publicRoutes = ["/login", "/signup"];

  if (publicRoutes.includes(pathname)) return NextResponse.next();

  if (pathname === "/") {
    if (!session) return NextResponse.redirect(new URL("/login", req.url));
    const role = (session.user as { role?: string })?.role;
    if (role === "ADMIN") return NextResponse.redirect(new URL("/admin", req.url));
    if (role === "VENUE_OWNER") return NextResponse.redirect(new URL("/dashboard", req.url));
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = (session.user as { role?: string })?.role;

  if (pathname === "/onboarding") {
    if (role === "VENUE_OWNER") return NextResponse.redirect(new URL("/dashboard", req.url));
    if (role === "ADMIN") return NextResponse.redirect(new URL("/admin", req.url));
    return NextResponse.next();
  }

  const venueRoutes = ["/dashboard", "/incentives", "/events", "/settings"];
  if (venueRoutes.some((r) => pathname.startsWith(r))) {
    if (role !== "VENUE_OWNER") {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
  }

  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/incentives/:path*",
    "/events/:path*",
    "/settings/:path*",
    "/admin/:path*",
    "/onboarding",
    "/login",
    "/signup",
  ],
};
