// ============================================================
// POST /api/auth/login — Sign in
// GET /api/auth/login — Check session
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { isUsingMockData, getMockCreatorById, mockCreators, getMockPassword } from "@/lib/mock-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { mapCreatorFromDb } from "@/lib/db-mappers";
import { checkRateLimit, getClientId, rateLimitHeaders } from "@/lib/rate-limit";
import { handleApiError, getStatusCode } from "@/lib/error-handler";
// FIXED: Blueprint Phase 3 — Zod validation
import { loginSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 login attempts per minute per IP
    const clientId = getClientId(request);
    const rateLimit = checkRateLimit(`login:${clientId}`, 5, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many login attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)), ...rateLimitHeaders(rateLimit) } }
      );
    }

    const body = await request.json();

    // FIXED: Blueprint Phase 3 — Zod replaces manual field checks
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { success: false, error: firstError?.message ?? "Invalid request data" },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    if (isUsingMockData()) {
      // Mock login: find creator by email
      const creator = mockCreators.find((c) => c.email === email);
      if (!creator) {
        return NextResponse.json(
          { success: false, error: "Invalid email or password" },
          { status: 401 }
        );
      }

      // Check mock password
      const expectedPassword = getMockPassword(creator.id);
      if (password !== expectedPassword) {
        return NextResponse.json(
          { success: false, error: "Invalid email or password" },
          { status: 401 }
        );
      }
      const response = NextResponse.json({
        success: true,
        data: creator,
      });
      // Set auth cookie so middleware can read it
      response.cookies.set("keevan-auth", JSON.stringify({ id: creator.id, email: creator.email }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
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
        {
          success: false,
          error: creatorError?.message || "Creator profile not found. Please contact support.",
          details: process.env.NODE_ENV === "development" ? creatorError?.details : undefined
        },
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
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    const errorResponse = handleApiError(error);
    const statusCode = getStatusCode(error);
    return NextResponse.json(errorResponse, { status: statusCode });
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
      } catch (error) {
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
