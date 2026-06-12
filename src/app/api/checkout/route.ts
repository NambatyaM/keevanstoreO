// ============================================================
// POST /api/checkout — Initiate a full checkout flow
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import {
  isUsingMockData,
  getMockProductById,
  getMockCreatorById,
  mockOrders,
  mockProducts,
  mockCreators,
  createMockDownloadSession,
} from "@/lib/mock-data";
import { PLATFORM_FEE_PERCENT } from "@/lib/constants";
import { submitOrder, registerIPN } from "@/lib/pesapal";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { mapProductFromDb, mapOrderFromDb } from "@/lib/db-mappers";
import { checkRateLimit, getClientId } from "@/lib/rate-limit";
import type { Order, OrderStatus, PaymentMethod } from "@/types";

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 checkout attempts per minute per IP
    const clientId = getClientId(request);
    const rateLimit = checkRateLimit(`checkout:${clientId}`, 10, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many checkout attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { productId, buyerEmail, buyerName, paymentMethod } = body;

    // Validate required fields
    if (!productId || !buyerEmail || !buyerName || !paymentMethod) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: productId, buyerEmail, buyerName, paymentMethod",
        },
        { status: 400 }
      );
    }

    // Validate buyer email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(buyerEmail.trim())) {
      return NextResponse.json(
        { success: false, error: "Invalid buyer email address" },
        { status: 400 }
      );
    }

    if (isUsingMockData()) {
      // Get product details
      const product = getMockProductById(productId);
      if (!product) {
        return NextResponse.json(
          { success: false, error: "Product not found" },
          { status: 404 }
        );
      }

      // Check if product is active
      if (product.status !== "active") {
        return NextResponse.json(
          { success: false, error: "Product is not available for purchase" },
          { status: 400 }
        );
      }

      // For events: check capacity not exceeded
      if (product.type === "event" && product.capacity !== null) {
        if (product.ticketsSold >= product.capacity) {
          return NextResponse.json(
            { success: false, error: "Event is sold out" },
            { status: 400 }
          );
        }
      }

      // Calculate fees
      const amount = product.price;
      const platformFee = Math.round((amount * PLATFORM_FEE_PERCENT) / 100);
      const creatorEarning = amount - platformFee;

      // Create pending order
      const orderId = crypto.randomUUID();
      const trackingId = `checkout-tracking-${crypto.randomUUID()}`;

      const newOrder: Order = {
        id: orderId,
        creatorId: product.creatorId,
        productId,
        buyerEmail,
        buyerName,
        amount,
        platformFee,
        creatorEarning,
        currency: product.currency,
        status: "pending" as OrderStatus,
        paymentMethod: paymentMethod as PaymentMethod,
        pesapalOrderTrackingId: trackingId,
        pesapalTransactionId: null,
        downloadToken: product.type === "digital" ? `dl-${crypto.randomUUID()}` : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Add to mock orders
      mockOrders.push(newOrder);

      // Simulate Pesapal payment — auto-complete after brief delay
      setTimeout(() => {
        const orderIndex = mockOrders.findIndex((o) => o.id === orderId);
        if (orderIndex >= 0) {
          mockOrders[orderIndex] = {
            ...mockOrders[orderIndex],
            status: "completed" as OrderStatus,
            pesapalTransactionId: `mock-txn-${Date.now()}`,
            updatedAt: new Date().toISOString(),
          };

          // Update product sales count
          const prodIndex = mockProducts.findIndex((p) => p.id === productId);
          if (prodIndex >= 0) {
            mockProducts[prodIndex].salesCount += 1;
            if (mockProducts[prodIndex].type === "event") {
              mockProducts[prodIndex].ticketsSold += 1;
            }
          }

          // Update creator balance
          const creatorIndex = mockCreators.findIndex(
            (c) => c.id === product.creatorId
          );
          if (creatorIndex >= 0) {
            mockCreators[creatorIndex].balance += creatorEarning;
            mockCreators[creatorIndex].totalEarnings += creatorEarning;
            mockCreators[creatorIndex].totalSales += 1;
          }

          // Create download session for digital products
          if (product.type === "digital") {
            createMockDownloadSession(orderId, productId);
          }
        }
      }, 2000);

      // Return mock success response immediately
      return NextResponse.json({
        success: true,
        data: {
          orderId,
          paymentUrl: `/payment/success?orderId=${orderId}&trackingId=${trackingId}`,
          status: "pending",
          order: newOrder,
        },
      });
    }

    // ── Real Supabase + Pesapal flow ──────────────────────────

    // Get product from Supabase
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Supabase not configured" },
        { status: 500 }
      );
    }

    const { data: productRow, error: productError } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .single();

    if (productError || !productRow) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    const product = mapProductFromDb(productRow);

    // Check if product is active
    if (product.status !== "active") {
      return NextResponse.json(
        { success: false, error: "Product is not available for purchase" },
        { status: 400 }
      );
    }

    // For events: check capacity
    if (product.type === "event" && product.capacity !== null) {
      if (product.ticketsSold >= product.capacity) {
        return NextResponse.json(
          { success: false, error: "Event is sold out" },
          { status: 400 }
        );
      }
    }

    // Calculate fees
    const amount = product.price;
    const platformFee = Math.round((amount * PLATFORM_FEE_PERCENT) / 100);
    const creatorEarning = amount - platformFee;

    // Create order in database using service role client (buyer is not authenticated)
    const serviceClient = createServiceRoleClient();
    if (!serviceClient) {
      return NextResponse.json(
        { success: false, error: "Service unavailable" },
        { status: 500 }
      );
    }

    const orderId = crypto.randomUUID();

    // Register IPN with Pesapal
    const ipnUrl = process.env.PESAPAL_IPN_URL || `${process.env.NEXT_PUBLIC_APP_URL}/api/pesapal/ipn`;
    const ipnId = await registerIPN(ipnUrl);

    const { data: orderRow, error: orderError } = await serviceClient
      .from("orders")
      .insert({
        id: orderId,
        product_id: productId,
        creator_id: product.creatorId,
        buyer_email: buyerEmail,
        buyer_name: buyerName,
        amount,
        platform_fee: platformFee,
        creator_earning: creatorEarning,
        currency: product.currency,
        status: "pending",
        payment_method: paymentMethod,
        download_token: product.type === "digital" ? `dl-${crypto.randomUUID()}` : null,
      })
      .select()
      .single();

    if (orderError || !orderRow) {
      console.error("Error creating order:", orderError);
      return NextResponse.json(
        { success: false, error: "Failed to create order" },
        { status: 500 }
      );
    }

    const order = mapOrderFromDb(orderRow);

    // Call Pesapal to initiate payment
    const pesapalResponse = await submitOrder({
      id: orderId,
      currency: product.currency,
      amount,
      description: `Purchase: ${product.title}`,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/pesapal/callback`,
      notification_id: ipnId || orderId,
      billing_address: {
        email_address: buyerEmail,
        phone_number: "",
        country_code: "UG",
        first_name: buyerName.split(" ")[0] || buyerName,
        last_name: buyerName.split(" ").slice(1).join(" ") || "",
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

    return NextResponse.json({
      success: true,
      data: {
        orderId,
        paymentUrl: pesapalResponse?.redirect_url || "",
        status: "pending",
        order,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
