// ============================================================
// GET /api/donations — Get creator's donations
// POST /api/donations — Create a new donation
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import {
  isUsingMockData,
  getMockDonations,
  getMockCreatorById,
  mockDonations,
  mockCreators,
  mockOrders,
} from "@/lib/mock-data";
import { PLATFORM_FEE_PERCENT, CREATOR_EARNING_PERCENT } from "@/lib/constants";
import type { Donation, Order, OrderStatus, PaymentMethod } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const creatorId = request.nextUrl.searchParams.get("creator_id");

    if (!creatorId) {
      return NextResponse.json(
        { success: false, error: "creator_id is required" },
        { status: 400 }
      );
    }

    if (isUsingMockData()) {
      const donations = getMockDonations(creatorId).sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return NextResponse.json({
        success: true,
        data: donations,
        total: donations.length,
      });
    }

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { creatorId, donorEmail, donorName, amount, message, anonymous } =
      body;

    // Validate required fields
    if (!creatorId || !amount) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: creatorId, amount",
        },
        { status: 400 }
      );
    }

    // Validate amount
    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Amount must be greater than 0" },
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

      if (!creator.donationsEnabled) {
        return NextResponse.json(
          { success: false, error: "Creator has not enabled donations" },
          { status: 400 }
        );
      }

      // Create donation record
      const donationId = `don-${Date.now()}`;
      const donation: Donation = {
        id: donationId,
        creatorId,
        donorEmail: anonymous ? "" : donorEmail || "",
        donorName: anonymous ? "Anonymous" : donorName || "Anonymous",
        amount,
        message: message || "",
        anonymous: !!anonymous,
        createdAt: new Date().toISOString(),
      };

      mockDonations.push(donation);

      // Also create an order for the donation
      const platformFee = Math.round((amount * PLATFORM_FEE_PERCENT) / 100);
      const creatorEarning = amount - platformFee;

      const donationOrder: Order = {
        id: `order-don-${Date.now()}`,
        creatorId,
        productId: `donation-${donationId}`,
        buyerEmail: anonymous ? "" : donorEmail || "",
        buyerName: anonymous ? "Anonymous" : donorName || "Anonymous",
        amount,
        platformFee,
        creatorEarning,
        currency: "UGX",
        status: "completed" as OrderStatus,
        paymentMethod: "mtn_momo" as PaymentMethod,
        pesapalOrderTrackingId: `mock-don-tracking-${Date.now()}`,
        pesapalTransactionId: `mock-don-txn-${Date.now()}`,
        downloadToken: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockOrders.push(donationOrder);

      // Update creator balance and donation current
      const creatorIndex = mockCreators.findIndex((c) => c.id === creatorId);
      if (creatorIndex >= 0) {
        mockCreators[creatorIndex].balance += creatorEarning;
        mockCreators[creatorIndex].totalEarnings += creatorEarning;
        mockCreators[creatorIndex].donationCurrent += amount;
        mockCreators[creatorIndex].totalSales += 1;
      }

      return NextResponse.json({
        success: true,
        data: donation,
      });
    }

    // Real Supabase + Pesapal flow
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
