// ============================================================
// POST /api/auth/logout — Sign out
// ============================================================
import { NextResponse } from "next/server";

export async function POST() {
  // In mock mode, just return success
  // In production, would sign out from Supabase
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
