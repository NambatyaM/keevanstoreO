// ============================================================
// Middleware — Auth protection for dashboard routes
// ============================================================
import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (
    pathname.startsWith("/store/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname === "/" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/uploads")
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
            const { data: creatorRow } = await supabase
              .from("creators")
              .select("is_admin")
              .eq("id", user.id)
              .single();
            if (creatorRow?.is_admin) {
              isAuthorized = true;
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
