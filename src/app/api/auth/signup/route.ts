// ============================================================
// POST /api/auth/signup — Register new creator
// GET /api/auth/signup?check_username=xxx — Check username availability
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { isUsingMockData, isMockUsernameAvailable, mockCreators, setMockPassword } from "@/lib/mock-data";
import { USERNAME_RULES } from "@/lib/constants";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { mapCreatorFromDb } from "@/lib/db-mappers";
import { checkRateLimit, getClientId, rateLimitHeaders } from "@/lib/rate-limit";
// FIXED: Blueprint Phase 3 — Zod validation
import { signupSchema } from "@/lib/validations";
import type { Creator } from "@/types";

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 3 signup attempts per minute per IP
    const clientId = getClientId(request);
    const rateLimit = checkRateLimit(`signup:${clientId}`, 3, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many signup attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)), ...rateLimitHeaders(rateLimit) } }
      );
    }

    const body = await request.json();

    // FIXED: Blueprint Phase 3 — Zod replaces manual validation
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { success: false, error: firstError?.message ?? "Invalid request data" },
        { status: 400 }
      );
    }

    const { email, password, username, displayName } = parsed.data;

    if (isUsingMockData()) {
      // Check username availability
      if (!isMockUsernameAvailable(username)) {
        return NextResponse.json(
          { success: false, error: "Username is already taken" },
          { status: 409 }
        );
      }

      // Check email uniqueness
      if (mockCreators.some((c) => c.email === email)) {
        return NextResponse.json(
          { success: false, error: "An account with this email already exists" },
          { status: 409 }
        );
      }

      // Create mock creator
      const newCreator: Creator = {
        id: `creator-${Date.now()}`,
        email,
        username,
        displayName,
        bio: "",
        photoUrl: null,
        bannerUrl: null,
        socialLinks: [],
        donationsEnabled: false,
        donationGoal: null,
        donationCurrent: 0,
        balance: 0,
        totalEarnings: 0,
        totalSales: 0,
        totalViews: 0,
        isAdmin: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Persist the new creator in mock data so they can log back in
      mockCreators.push(newCreator);

      // Save the password so the new user can actually log in
      setMockPassword(newCreator.id, password);

      const response = NextResponse.json({
        success: true,
        data: newCreator,
      });

      // Set auth cookie for middleware compatibility
      response.cookies.set("keevan-auth", JSON.stringify({ id: newCreator.id, email: newCreator.email }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        sameSite: "lax",
      });

      return response;
    }

    // Real Supabase signup
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Supabase not configured" },
        { status: 500 }
      );
    }

    // Check username availability against real DB
    const { data: existingUser } = await supabase
      .from("creators")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Username is already taken" },
        { status: 409 }
      );
    }

    // Sign up the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          display_name: displayName,
        },
      },
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { success: false, error: authError?.message || "Signup failed" },
        { status: 400 }
      );
    }

    // Insert creator profile using service role client (bypasses RLS)
    const serviceClient = createServiceRoleClient();
    if (!serviceClient) {
      return NextResponse.json(
        { success: false, error: "Service client not available" },
        { status: 500 }
      );
    }

    const { data: creatorRow, error: insertError } = await serviceClient
      .from("creators")
      .insert({
        id: authData.user.id,
        email,
        username,
        display_name: displayName,
      })
      .select()
      .single();

    if (insertError || !creatorRow) {
      console.error("Failed to create creator profile:", insertError);
      return NextResponse.json(
        { success: false, error: "Failed to create creator profile" },
        { status: 500 }
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
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Error in signup POST:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Username availability check
  const username = request.nextUrl.searchParams.get("check_username");

  if (!username) {
    return NextResponse.json(
      { success: false, error: "Username parameter required" },
      { status: 400 }
    );
  }

  // Validate format
  if (
    !USERNAME_RULES.PATTERN.test(username) ||
    username.length < USERNAME_RULES.MIN_LENGTH
  ) {
    return NextResponse.json({ available: false, reason: "invalid_format" });
  }

  if (isUsingMockData()) {
    const available = isMockUsernameAvailable(username);
    return NextResponse.json({ available });
  }

  // Real check against Supabase
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ available: true });
  }

  const { data } = await supabase
    .from("creators")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (data) {
    return NextResponse.json({ available: false });
  }

  return NextResponse.json({ available: true });
}
