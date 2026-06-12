// ============================================================
// POST /api/auth/login — Sign in
// GET /api/auth/login — Check session
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { isUsingMockData, getMockCreatorById, mockCreators } from "@/lib/mock-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { mapCreatorFromDb } from "@/lib/db-mappers";

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

    // Real Supabase login
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Supabase not configured" },
        { status: 500 }
      );
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { success: false, error: authError?.message || "Invalid email or password" },
        { status: 401 }
      );
    }

    // Query creator profile
    const { data: creatorRow, error: creatorError } = await supabase
      .from("creators")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    if (creatorError || !creatorRow) {
      return NextResponse.json(
        { success: false, error: "Creator profile not found. Please contact support." },
        { status: 404 }
      );
    }

    const creator = mapCreatorFromDb(creatorRow);

    const response = NextResponse.json({
      success: true,
      data: creator,
    });

    // Set auth cookie for middleware compatibility
    response.cookies.set("keevan-auth", JSON.stringify({ id: authData.user.id, email: authData.user.email }), {
      httpOnly: false,
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: "lax",
    });

    return response;
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

  // Real Supabase session check
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({
      success: false,
      error: "Not authenticated",
    });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({
      success: false,
      error: "Not authenticated",
    });
  }

  // Query creator profile
  const { data: creatorRow } = await supabase
    .from("creators")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!creatorRow) {
    return NextResponse.json({
      success: false,
      error: "Creator profile not found",
    });
  }

  const creator = mapCreatorFromDb(creatorRow);

  return NextResponse.json({
    success: true,
    data: creator,
  });
}
