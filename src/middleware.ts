// ============================================================
// Middleware — Auth protection for dashboard routes
// ============================================================
import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Simple in-memory cache for admin status (5 minute TTL)
const adminCache = new Map<string, { isAdmin: boolean; expiresAt: number }>();

function getCachedAdminStatus(userId: string): boolean | null {
  const cached = adminCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.isAdmin;
  }
  adminCache.delete(userId);
  return null;
}

function setCachedAdminStatus(userId: string, isAdmin: boolean): void {
  adminCache.set(userId, {
    isAdmin,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (
    pathname.startsWith("/store/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/about") ||
    pathname.startsWith("/contact") ||
    pathname.startsWith("/privacy") ||
    pathname.startsWith("/terms") ||
    pathname.startsWith("/payment/") ||
    pathname.startsWith("/download/") ||
    pathname === "/" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/uploads") ||
    pathname.startsWith("/demo-") ||
    pathname === "/sitemap.xml"
  ) {
    // Refresh auth session if possible
    const { response } = await updateSession(request);
    return response;
  }

  // Protect dashboard routes
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/products") ||
    pathname.startsWith("/analytics") ||
    pathname.startsWith("/withdrawals") ||
    pathname.startsWith("/events") ||
    (pathname.startsWith("/store") && !pathname.startsWith("/store/"))
  ) {
    const { response, isAuthenticated } = await updateSession(request);

    if (!isAuthenticated) {
      // Check for mock auth cookie
      const mockAuthCookie = request.cookies.get("keevan-auth");
      if (mockAuthCookie?.value) {
        return response;
      }

      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(redirectUrl);
    }

    return response;
  }

  // Protect admin routes — require authentication AND admin role
  if (pathname.startsWith("/admin")) {
    const { response, isAuthenticated } = await updateSession(request);

    let isAuthorized = false;

    if (isAuthenticated) {
      // For real Supabase auth, check is_admin from the creators table
      // We use the service role to query the user's admin status
      try {
        const { createServerSupabaseClient } = await import("@/lib/supabase/server");
        const supabase = await createServerSupabaseClient();
        if (supabase) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            // Check cache first
            const cachedAdmin = getCachedAdminStatus(user.id);
            if (cachedAdmin !== null) {
              isAuthorized = cachedAdmin;
            } else {
              // Query database if not cached
              const { data: creatorRow } = await supabase
                .from("creators")
                .select("is_admin")
                .eq("id", user.id)
                .single();
              const isAdmin = creatorRow?.is_admin || false;
              setCachedAdminStatus(user.id, isAdmin);
              isAuthorized = isAdmin;
            }
          }
        }
      } catch {
        // If Supabase check fails, fall through to mock check
      }
    }

    // Check mock auth cookie
    if (!isAuthorized) {
      const mockAuthCookie = request.cookies.get("keevan-auth");
      if (mockAuthCookie?.value) {
        try {
          const { id } = JSON.parse(mockAuthCookie.value);
          // In mock mode, verify the user exists and is admin
          const { getMockCreatorById } = await import("@/lib/mock-data");
          const creator = getMockCreatorById(id);
          if (creator?.isAdmin) {
            isAuthorized = true;
          }
        } catch {
          // Invalid cookie
        }
      }
    }

    if (!isAuthorized) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("redirect", "/admin");
      return NextResponse.redirect(redirectUrl);
    }

    return response;
  }

  const { response } = await updateSession(request);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
