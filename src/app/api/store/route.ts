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

    return NextResponse.json(
      { success: false, error: "Store not found" },
      { status: 404 }
    );
  } catch {
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

    if (isUsingMockData()) {
      const creator = getMockCreatorById(creatorId);
      if (!creator) {
        return NextResponse.json(
          { success: false, error: "Creator not found" },
          { status: 404 }
        );
      }

      const updatedCreator: Creator = {
        ...creator,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      return NextResponse.json({ success: true, data: updatedCreator });
    }

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
          donorEmail: anonymous ? "" : donorEmail,
          donorName: anonymous ? "Anonymous" : donorName,
          amount,
          message: message || "",
          anonymous: !!anonymous,
          createdAt: new Date().toISOString(),
        };

        return NextResponse.json({ success: true, data: donation });
      }
    }

    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
