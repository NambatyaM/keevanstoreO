// ============================================================
// POST /api/auth/logout — Sign out
// ============================================================
import { NextResponse } from "next/server";
import { isUsingMockData } from "@/lib/mock-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST() {
  if (!isUsingMockData()) {
    // Sign out from Supabase
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
  }

  const response = NextResponse.json({ success: true });
  // Clear auth cookie
  response.cookies.set("keevan-auth", "", {
    httpOnly: false,
    path: "/",
    maxAge: 0,
    sameSite: "lax",
  });
  return response;
}
