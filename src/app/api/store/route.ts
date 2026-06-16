// ============================================================
// GET /api/store — Get store data
// PUT /api/store — Update store settings
// POST /api/store — Handle donations
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import {
  isUsingMockData,
  getMockStorePublicData,
  getMockCreatorById,
  mockCreators,
} from "@/lib/mock-data";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { mapCreatorFromDb, mapProductFromDb, mapCreatorToDb } from "@/lib/db-mappers";
import type { Creator, Donation } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const username = request.nextUrl.searchParams.get("username");
    const creatorId = request.nextUrl.searchParams.get("creator_id");

    if (isUsingMockData()) {
      if (username) {
        const storeData = getMockStorePublicData(username);
        if (!storeData) {
          return NextResponse.json(
            { success: false, error: "Store not found" },
            { status: 404 }
          );
        }
        return NextResponse.json({ success: true, data: storeData });
      }

      if (creatorId) {
        const creator = getMockCreatorById(creatorId);
        if (!creator) {
          return NextResponse.json(
            { success: false, error: "Store not found" },
            { status: 404 }
          );
        }
        return NextResponse.json({ success: true, data: creator });
      }

      return NextResponse.json(
        { success: false, error: "Username or creator_id required" },
        { status: 400 }
      );
    }

    // Real Supabase queries
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Store not found" },
        { status: 404 }
      );
    }

    if (username) {
      // Find creator by username
      const { data: creatorRow, error: creatorError } = await supabase
        .from("creators")
        .select("*")
        .eq("username", username)
        .eq("is_active", true)
        .single();

      if (creatorError || !creatorRow) {
        return NextResponse.json(
          { success: false, error: "Store not found" },
          { status: 404 }
        );
      }

      const creator = mapCreatorFromDb(creatorRow);

      // Get active products for this creator
      const { data: productRows, error: productsError } = await supabase
        .from("products")
        .select("*")
        .eq("creator_id", creator.id)
        .eq("status", "active");

      if (productsError) {
        console.error("Error fetching products:", productsError);
      }

      const products = (productRows || []).map((row) => mapProductFromDb(row));

      return NextResponse.json({
        success: true,
        data: { creator, products },
      });
    }

    if (creatorId) {
      const { data: creatorRow, error: creatorError } = await supabase
        .from("creators")
        .select("*")
        .eq("id", creatorId)
        .single();

      if (creatorError || !creatorRow) {
        return NextResponse.json(
          { success: false, error: "Store not found" },
          { status: 404 }
        );
      }

      const creator = mapCreatorFromDb(creatorRow);
      return NextResponse.json({ success: true, data: creator });
    }

    return NextResponse.json(
      { success: false, error: "Username or creator_id required" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in store GET:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { creatorId, ...updates } = body;

    if (!creatorId) {
      return NextResponse.json(
        { success: false, error: "creator_id is required" },
        { status: 400 }
      );
    }

    // Whitelist of fields that creators are allowed to update
    const ALLOWED_FIELDS = [
      "displayName", "bio", "photoUrl", "bannerUrl",
      "socialLinks", "donationsEnabled", "donationGoal",
    ] as const;

    // Filter updates to only allowed fields (prevents balance/admin manipulation)
    const safeUpdates: Record<string, unknown> = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in updates) {
        safeUpdates[key] = updates[key as keyof typeof updates];
      }
    }

    if (isUsingMockData()) {
      const creatorIndex = mockCreators.findIndex((c) => c.id === creatorId);
      if (creatorIndex < 0) {
        return NextResponse.json(
          { success: false, error: "Creator not found" },
          { status: 404 }
        );
      }

      const updatedCreator: Creator = {
        ...mockCreators[creatorIndex],
        ...(safeUpdates as Partial<Creator>),
        updatedAt: new Date().toISOString(),
      };

      // Persist the update in mock data so it survives across requests
      mockCreators[creatorIndex] = updatedCreator;

      return NextResponse.json({ success: true, data: updatedCreator });
    }

    // Real Supabase update
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Supabase not configured" },
        { status: 500 }
      );
    }

    // Verify authenticated user matches creatorId
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== creatorId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Map camelCase safe updates to snake_case for DB
    const dbUpdates = mapCreatorToDb(safeUpdates);

    const { data: updatedRow, error: updateError } = await supabase
      .from("creators")
      .update(dbUpdates)
      .eq("id", creatorId)
      .select()
      .single();

    if (updateError || !updatedRow) {
      console.error("Error updating creator:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to update store" },
        { status: 500 }
      );
    }

    const updatedCreator = mapCreatorFromDb(updatedRow);
    return NextResponse.json({ success: true, data: updatedCreator });
  } catch (error) {
    console.error("Error in store PUT:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type } = body;

    if (type === "donation") {
      const { creatorId, amount, message, anonymous, donorName, donorEmail } = body;

      if (!creatorId || !amount || amount < 1000) {
        return NextResponse.json(
          { success: false, error: "Invalid donation details" },
          { status: 400 }
        );
      }

      if (isUsingMockData()) {
        const donation: Donation = {
          id: `don-${Date.now()}`,
          creatorId,
          orderId: null,
          donorEmail: anonymous ? "" : donorEmail,
          donorName: anonymous ? "Anonymous" : donorName,
          amount,
          message: message || "",
          anonymous: !!anonymous,
          createdAt: new Date().toISOString(),
        };

        return NextResponse.json({ success: true, data: donation });
      }

      // Real Supabase donation insert handled via /api/donations
      return NextResponse.json(
        { success: false, error: "Use /api/donations for real donations" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in store POST:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
