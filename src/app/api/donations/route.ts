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

      // FIXED: Mock mode should also create pending order and simulate payment flow
      const platformFee = Math.round((amount * PLATFORM_FEE_PERCENT) / 100);
      const creatorEarning = amount - platformFee;
      const orderId = `order-don-${Date.now()}`;
      const trackingId = `mock-don-tracking-${Date.now()}`;

      // Create pending order first
      const donationOrder: Order = {
        id: orderId,
        creatorId,
        productId: null,
        buyerEmail: anonymous ? "" : donorEmail || "",
        buyerName: anonymous ? "Anonymous" : donorName || "Anonymous",
        amount,
        platformFee,
        creatorEarning,
        currency: "UGX",
        status: "pending" as OrderStatus,
        paymentMethod: "mtn_momo" as PaymentMethod,
        pesapalOrderTrackingId: trackingId,
        pesapalTransactionId: null,
        downloadToken: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockOrders.push(donationOrder);

      // Create donation record linked to order
      const donationId = `don-${Date.now()}`;
      const donation: Donation = {
        id: donationId,
        creatorId,
        orderId: orderId,
        donorEmail: anonymous ? "" : donorEmail || "",
        donorName: anonymous ? "Anonymous" : donorName || "Anonymous",
        amount,
        message: message || "",
        anonymous: !!anonymous,
        createdAt: new Date().toISOString(),
      };

      mockDonations.push(donation);

      // Simulate payment completion after delay
      setTimeout(() => {
        const orderIndex = mockOrders.findIndex((o) => o.id === orderId);
        if (orderIndex >= 0) {
          mockOrders[orderIndex] = {
            ...mockOrders[orderIndex],
            status: "completed" as OrderStatus,
            pesapalTransactionId: `mock-don-txn-${Date.now()}`,
            updatedAt: new Date().toISOString(),
          };

          // Update creator balance and donation current
          const creatorIndex = mockCreators.findIndex((c) => c.id === creatorId);
          if (creatorIndex >= 0) {
            mockCreators[creatorIndex].balance += creatorEarning;
            mockCreators[creatorIndex].totalEarnings += creatorEarning;
            mockCreators[creatorIndex].donationCurrent += amount;
            mockCreators[creatorIndex].totalSales += 1;
          }
        }
      }, 2000);

      // FIXED: Return payment URL for redirect
      return NextResponse.json({
        success: true,
        data: {
          donation,
          orderId,
          paymentUrl: `/payment/success?orderId=${orderId}&trackingId=${trackingId}`,
          status: "pending",
        },
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

    // FIXED: Donations must go through Pesapal payment flow like regular purchases
    // Create pending order first (not completed)
    const orderId = crypto.randomUUID();
    const ipnUrl = process.env.PESAPAL_IPN_URL || `${process.env.NEXT_PUBLIC_APP_URL}/api/pesapal/ipn`;
    
    // Import Pesapal functions
    const { submitOrder, registerIPN } = await import("@/lib/pesapal");
    const ipnId = await registerIPN(ipnUrl);

    const { data: orderRow, error: orderError } = await serviceClient
      .from("orders")
      .insert({
        id: orderId,
        creator_id: creatorId,
        product_id: null, // Donations don't have a product
        buyer_email: anonymous ? "" : (donorEmail || ""),
        buyer_name: anonymous ? "Anonymous" : (donorName || "Anonymous"),
        amount,
        platform_fee: platformFee,
        creator_earning: creatorEarning,
        currency: "UGX",
        status: "pending", // FIXED: Start as pending, not completed
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

    // Create donation record linked to the order
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

    // FIXED: Submit to Pesapal for payment processing
    const pesapalResponse = await submitOrder({
      id: orderId,
      currency: "UGX",
      amount,
      description: `Donation to ${creatorId}`,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/pesapal/callback`,
      notification_id: ipnId || orderId,
      billing_address: {
        email_address: anonymous ? "" : (donorEmail || ""),
        phone_number: "",
        country_code: "UG",
        first_name: anonymous ? "Anonymous" : (donorName || "").split(" ")[0] || "Anonymous",
        last_name: anonymous ? "" : (donorName || "").split(" ").slice(1).join(" ") || "",
        line_1: "",
        city: "Kampala",
        state: "Central",
        postal_code: "00000",
        zip_code: "00000",
      },
    });

    // Update order with Pesapal tracking ID
    if (pesapalResponse?.order_tracking_id) {
      await serviceClient
        .from("orders")
        .update({
          pesapal_order_tracking_id: pesapalResponse.order_tracking_id,
        })
        .eq("id", orderId);
    }

    const donation = mapDonationFromDb(donationRow);

    // FIXED: Return Pesapal redirect URL instead of marking as completed
    return NextResponse.json({
      success: true,
      data: {
        donation,
        orderId,
        paymentUrl: pesapalResponse?.redirect_url || "",
        status: "pending",
      },
    });
  } catch (error) {
    console.error("Error in donations POST:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
