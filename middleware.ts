import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Protected routes that require authentication
const protectedRoutes = [
  "/profile",
  "/settings",
  "/admin",
  "/api/admin",
  "/invoice-automation",
];

// Routes that should be accessible only by admin users
const adminRoutes = ["/admin", "/api/admin"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  
  // If the route is not protected, allow access
  if (!isProtectedRoute) {
    return NextResponse.next();
  }
  
  // Get the user's token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  
  // If there is no token, redirect to the sign-in page
  if (!token) {
    const url = new URL("/auth/signin", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
  
  // Check if the route is admin-only
  const isAdminRoute = adminRoutes.some((route) =>
    pathname.startsWith(route)
  );
  
  // If the route is admin-only and the user is not an admin, redirect to the home page
  if (isAdminRoute && token.role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }
  
  // Allow access to the protected route
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api/auth paths (authentication endpoints)
     * 2. /_next (Next.js internals)
     * 3. /fonts, /images (static files)
     * 4. /favicon.ico, /sitemap.xml (static files)
     */
    "/((?!api/auth|_next|fonts|images|favicon.ico|sitemap.xml).*)",
  ],
}; 