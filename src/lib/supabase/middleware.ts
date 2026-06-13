// ============================================================
// Supabase Middleware Helper
// ============================================================
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isSupabaseConfigured =
  SUPABASE_URL &&
  SUPABASE_URL !== "mock" &&
  SUPABASE_URL !== "" &&
  SUPABASE_ANON_KEY &&
  SUPABASE_ANON_KEY !== "mock" &&
  SUPABASE_ANON_KEY !== "";

export async function updateSession(request: NextRequest) {
  if (!isSupabaseConfigured) {
    // In mock mode, check for auth cookie
    const authCookie = request.cookies.get("keevan-auth");
    const isAuthenticated = !!authCookie?.value;
    return { response: NextResponse.next({ request }), isAuthenticated };
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response: supabaseResponse, isAuthenticated: !!user };
}
