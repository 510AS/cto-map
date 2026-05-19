import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Routes that don't require authentication
const publicRoutes = [
  "/auth/login",
  "/auth/register",
  "/auth/verify",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/error",
];

// API routes that don't require authentication
const publicApiRoutes = [
  "/api/auth",
];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Allow public routes
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  const isPublicApi = publicApiRoutes.some((route) => pathname.startsWith(route));

  if (isPublicRoute || isPublicApi) {
    // Redirect logged-in users away from auth pages
    if (isLoggedIn && isPublicRoute) {
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }
    return NextResponse.next();
  }

  // Protect all other routes
  if (!isLoggedIn) {
    const loginUrl = new URL("/auth/login", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Match all routes except static files and _next
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/).*)",
  ],
};
