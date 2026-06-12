// ============================================================
// GET /api/admin/creators — List all creators
// PATCH /api/admin/creators — Update creator (activate/deactivate, verify)
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import {
  isUsingMockData,
  mockCreators,
  getMockCreatorById,
} from "@/lib/mock-data";

export async function GET() {
  try {
    if (isUsingMockData()) {
      return NextResponse.json({
        success: true,
        data: mockCreators,
        total: mockCreators.length,
      });
    }

    // Real Supabase query
    return NextResponse.json({
      success: true,
      data: [],
      total: 0,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { creatorId, action } = body;

    if (!creatorId || !action) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: creatorId, action" },
        { status: 400 }
      );
    }

    const validActions = ["activate", "deactivate", "verify", "unverify"];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { success: false, error: `Invalid action. Must be one of: ${validActions.join(", ")}` },
        { status: 400 }
      );
    }

    if (isUsingMockData()) {
      const creatorIndex = mockCreators.findIndex((c) => c.id === creatorId);
      if (creatorIndex < 0) {
        return NextResponse.json(
          { success: false, error: "Creator not found" },
          { status: 404 }
        );
      }

      // For mock purposes, we track verification and active status
      // The Creator type doesn't have these fields explicitly, but we return a success response
      // with the action applied
      return NextResponse.json({
        success: true,
        data: {
          ...mockCreators[creatorIndex],
          updatedAt: new Date().toISOString(),
          _adminAction: action,
          _active: action === "activate" ? true : action === "deactivate" ? false : undefined,
          _verified: action === "verify" ? true : action === "unverify" ? false : undefined,
        },
      });
    }

    // Real Supabase update
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
