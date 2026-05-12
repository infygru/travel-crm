import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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
  "/social",
  "/inbox",
  "/suppliers",
  "/quotes",
];

const PORTAL_PROTECTED_PREFIXES = [
  "/portal/dashboard",
  "/portal/bookings",
  "/portal/itineraries",
  "/portal/tickets",
];

// Security headers applied to all responses
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY")
  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff")
  // Force HTTPS (only effective over HTTPS)
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
  // Prevent referrer leakage
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  // Basic CSP — restrict where scripts can come from
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval needed for Next.js dev
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https: http:", // allow external images for user avatars
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
    ].join("; ")
  )
  // Remove server fingerprinting header
  response.headers.delete("X-Powered-By")
  return response
}

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const pathname = nextUrl.pathname;

  // Portal protection
  const isPortalProtected = PORTAL_PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );
  if (isPortalProtected) {
    const portalToken = req.cookies.get("portal_token")?.value;
    if (!portalToken) {
      return addSecurityHeaders(
        NextResponse.redirect(new URL("/portal/login", nextUrl))
      );
    }
    return addSecurityHeaders(NextResponse.next());
  }

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return addSecurityHeaders(NextResponse.redirect(loginUrl));
  }

  if ((pathname === "/login" || pathname === "/") && isLoggedIn) {
    return addSecurityHeaders(
      NextResponse.redirect(new URL("/dashboard", nextUrl))
    );
  }

  return addSecurityHeaders(NextResponse.next());
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon\\.ico|public|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
