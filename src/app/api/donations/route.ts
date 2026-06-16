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
import { PLATFORM_FEE_PERCENT, MIN_PRODUCT_PRICE } from "@/lib/constants";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { mapDonationFromDb } from "@/lib/db-mappers";
import { checkRateLimit, getClientId } from "@/lib/rate-limit";
import { createDonationSchema } from "@/lib/validations";
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

    // Real Supabase query
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
      });
    }

    // Verify authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== creatorId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { data: donationRows, error } = await supabase
      .from("donations")
      .select("*")
      .eq("creator_id", creatorId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching donations:", error);
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
      });
    }

    const donations = (donationRows || []).map((row) => mapDonationFromDb(row));

    return NextResponse.json({
      success: true,
      data: donations,
      total: donations.length,
    });
  } catch (error) {
    console.error("Error in donations GET:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 donation attempts per minute per IP
    const clientId = getClientId(request);
    const rateLimit = checkRateLimit(`donations:${clientId}`, 5, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many donation attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();

    // FIXED: Blueprint Phase 4 — Zod validation replaces manual checks
    const parsed = createDonationSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { success: false, error: firstError?.message ?? "Invalid request data" },
        { status: 400 }
      );
    }

    const { creatorId, donorEmail, donorName, amount, message, anonymous } = parsed.data;

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
        orderId: null,
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
    const serviceClient = createServiceRoleClient();
    if (!serviceClient) {
      return NextResponse.json(
        { success: false, error: "Supabase not configured" },
        { status: 500 }
      );
    }

    // Check if creator exists and has donations enabled
    const { data: creatorRow } = await serviceClient
      .from("creators")
      .select("id, donations_enabled")
      .eq("id", creatorId)
      .single();

    if (!creatorRow) {
      return NextResponse.json(
        { success: false, error: "Creator not found" },
        { status: 404 }
      );
    }

    if (!creatorRow.donations_enabled) {
      return NextResponse.json(
        { success: false, error: "Creator has not enabled donations" },
        { status: 400 }
      );
    }

    const platformFee = Math.round((amount * PLATFORM_FEE_PERCENT) / 100);
    const creatorEarning = amount - platformFee;

    // Create order for the donation first
    const { data: orderRow, error: orderError } = await serviceClient
      .from("orders")
      .insert({
        creator_id: creatorId,
        product_id: null, // Donations don't have a product
        buyer_email: anonymous ? "" : (donorEmail || ""),
        buyer_name: anonymous ? "Anonymous" : (donorName || "Anonymous"),
        amount,
        platform_fee: platformFee,
        creator_earning: creatorEarning,
        currency: "UGX",
        status: "completed",
        payment_method: "mtn_momo",
      })
      .select()
      .single();

    if (orderError || !orderRow) {
      console.error("Error creating donation order:", orderError);
      return NextResponse.json(
        { success: false, error: "Failed to create donation" },
        { status: 500 }
      );
    }

    // Create donation record
    const { data: donationRow, error: donationError } = await serviceClient
      .from("donations")
      .insert({
        creator_id: creatorId,
        order_id: orderRow.id,
        donor_email: anonymous ? "" : (donorEmail || ""),
        donor_name: anonymous ? "Anonymous" : (donorName || "Anonymous"),
        amount,
        message: message || "",
        is_anonymous: !!anonymous,
      })
      .select()
      .single();

    if (donationError || !donationRow) {
      console.error("Error creating donation:", donationError);
      return NextResponse.json(
        { success: false, error: "Failed to create donation" },
        { status: 500 }
      );
    }

    // Atomically update creator balance, total_earnings, donation_current, and total_sales
    // Using atomic SQL update to prevent race conditions with concurrent donations
    const { error: updateError } = await serviceClient.rpc("process_donation", {
      p_creator_id: creatorId,
      p_amount: amount,
      p_creator_earning: creatorEarning,
    });

    if (updateError) {
      // Fallback: if RPC doesn't exist yet, try the atomic increment_creator_earnings RPC
      console.error("RPC process_donation failed, trying fallback:", updateError.message);
      const { error: fallbackError } = await serviceClient.rpc("increment_creator_earnings", {
        p_creator_id: creatorId,
        p_amount: creatorEarning,
      });
      if (fallbackError) {
        console.error("All RPC fallbacks failed for donation balance update:", fallbackError.message);
        // Last resort: read-then-write (not atomic but preserves existing balance)
        const { data: currentCreator } = await serviceClient
          .from("creators")
          .select("balance, total_earnings, total_sales, donation_current")
          .eq("id", creatorId)
          .single();
        if (currentCreator) {
          await serviceClient
            .from("creators")
            .update({
              balance: Number(currentCreator.balance) + creatorEarning,
              total_earnings: Number(currentCreator.total_earnings) + creatorEarning,
              total_sales: Number(currentCreator.total_sales) + 1,
              donation_current: Number(currentCreator.donation_current) + amount,
            })
            .eq("id", creatorId);
        }
      }
    }

    const donation = mapDonationFromDb(donationRow);

    return NextResponse.json({
      success: true,
      data: donation,
    });
  } catch (error) {
    console.error("Error in donations POST:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
