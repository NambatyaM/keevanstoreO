// ============================================================
// POST /api/auth/signup — Register new creator
// GET /api/auth/signup?check_username=xxx — Check username availability
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { isUsingMockData, isMockUsernameAvailable, mockCreators } from "@/lib/mock-data";
import { USERNAME_RULES } from "@/lib/constants";
import type { Creator } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { email, password, username, displayName } = await request.json();

    if (!email || !password || !username || !displayName) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate username
    if (
      !USERNAME_RULES.PATTERN.test(username) ||
      username.length < USERNAME_RULES.MIN_LENGTH ||
      username.length > USERNAME_RULES.MAX_LENGTH
    ) {
      return NextResponse.json(
        { success: false, error: USERNAME_RULES.PATTERN_MESSAGE },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return NextResponse.json({
        success: true,
        data: newCreator,
      });
    }

    // Real Supabase signup would go here
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
  return NextResponse.json({ available: true });
}
