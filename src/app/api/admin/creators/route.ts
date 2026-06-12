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
import { createServiceRoleClient } from "@/lib/supabase/server";
import { mapCreatorFromDb } from "@/lib/db-mappers";
import { verifyAdmin } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    // Admin authentication check
    const adminCheck = await verifyAdmin(request);
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden: admin access required" },
        { status: 403 }
      );
    }

    if (isUsingMockData()) {
      return NextResponse.json({
        success: true,
        data: mockCreators,
        total: mockCreators.length,
      });
    }

    // Real Supabase query using service role client
    const serviceClient = createServiceRoleClient();
    if (!serviceClient) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
      });
    }

    const { data: creatorRows, error } = await serviceClient
      .from("creators")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching creators:", error);
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
      });
    }

    const creators = (creatorRows || []).map((row) => mapCreatorFromDb(row));

    return NextResponse.json({
      success: true,
      data: creators,
      total: creators.length,
    });
  } catch (error) {
    console.error("Error in admin creators GET:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Admin authentication check
    const adminCheck = await verifyAdmin(request);
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden: admin access required" },
        { status: 403 }
      );
    }

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

    // Real Supabase update using service role client
    const serviceClient = createServiceRoleClient();
    if (!serviceClient) {
      return NextResponse.json(
        { success: false, error: "Supabase not configured" },
        { status: 500 }
      );
    }

    const updates: Record<string, unknown> = {};

    switch (action) {
      case "activate":
        updates.is_active = true;
        break;
      case "deactivate":
        updates.is_active = false;
        break;
      case "verify":
        updates.is_verified = true;
        break;
      case "unverify":
        updates.is_verified = false;
        break;
    }

    const { data: updatedRow, error: updateError } = await serviceClient
      .from("creators")
      .update(updates)
      .eq("id", creatorId)
      .select()
      .single();

    if (updateError || !updatedRow) {
      console.error("Error updating creator:", updateError);
      return NextResponse.json(
        { success: false, error: "Creator not found or update failed" },
        { status: 404 }
      );
    }

    const creator = mapCreatorFromDb(updatedRow);

    return NextResponse.json({
      success: true,
      data: creator,
    });
  } catch (error) {
    console.error("Error in admin creators PATCH:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
