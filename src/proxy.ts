import { auth } from "@/auth";
import { NextResponse } from "next/server";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/contacts",
  "/companies",
  "/deals",
  "/bookings",
  "/packages",
  "/tasks",
  "/reports",
  "/settings",
  "/posters",
  "/marketing",
  "/itineraries",
  "/leads",
  "/tickets",
];

const PORTAL_PROTECTED_PREFIXES = [
  "/portal/dashboard",
  "/portal/bookings",
  "/portal/itineraries",
  "/portal/tickets",
];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const pathname = nextUrl.pathname;

  // Portal protection: check portal_token cookie for portal routes (except /portal/login)
  const isPortalProtected = PORTAL_PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );
  if (isPortalProtected) {
    const portalToken = req.cookies.get("portal_token")?.value;
    if (!portalToken) {
      return NextResponse.redirect(new URL("/portal/login", nextUrl));
    }
    return NextResponse.next();
  }

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );

  // Redirect unauthenticated users away from protected pages
  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from login
  if ((pathname === "/login" || pathname === "/") && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon\\.ico|public|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
