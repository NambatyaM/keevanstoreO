// ============================================================
// POST /api/auth/login — Sign in
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { isUsingMockData, getMockCreatorById, mockCreators } from "@/lib/mock-data";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (isUsingMockData()) {
      // Mock login: find creator by email
      const creator = mockCreators.find((c) => c.email === email);
      if (!creator) {
        return NextResponse.json(
          { success: false, error: "Invalid email or password" },
          { status: 401 }
        );
      }

      // In mock mode, any password works
      const response = NextResponse.json({
        success: true,
        data: creator,
      });
      // Set auth cookie so middleware can read it
      response.cookies.set("keevan-auth", JSON.stringify({ id: creator.id, email: creator.email }), {
        httpOnly: false,
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        sameSite: "lax",
      });
      return response;
    }

    // Real Supabase login would go here
    return NextResponse.json(
      { success: false, error: "Supabase not configured" },
      { status: 500 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Check session endpoint
  if (isUsingMockData()) {
    // In mock mode, check the keevan-auth cookie to restore session
    const authCookie = request.cookies.get("keevan-auth");
    if (authCookie?.value) {
      try {
        const { id } = JSON.parse(authCookie.value);
        const creator = getMockCreatorById(id);
        if (creator) {
          return NextResponse.json({
            success: true,
            data: creator,
          });
        }
      } catch {
        // Invalid cookie, fall through
      }
    }
    return NextResponse.json({
      success: false,
      error: "Not authenticated",
    });
  }

  return NextResponse.json({
    success: false,
    error: "Not authenticated",
  });
}
