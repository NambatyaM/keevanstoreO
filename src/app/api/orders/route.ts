// ============================================================
// GET /api/orders — Get creator's orders
// POST /api/orders — Create a new order
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import {
  isUsingMockData,
  getMockOrders,
  getMockProductById,
  getMockCreatorById,
  mockOrders,
  mockProducts,
  mockCreators,
} from "@/lib/mock-data";
import { PLATFORM_FEE_PERCENT } from "@/lib/constants";
import { submitOrder, registerIPN } from "@/lib/pesapal";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { mapOrderFromDb, mapProductFromDb } from "@/lib/db-mappers";
import type { Order, OrderStatus, PaymentMethod } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const creatorId = request.nextUrl.searchParams.get("creator_id");
    const status = request.nextUrl.searchParams.get("status");

    if (!creatorId) {
      return NextResponse.json(
        { success: false, error: "creator_id is required" },
        { status: 400 }
      );
    }

    if (isUsingMockData()) {
      let orders = getMockOrders(creatorId);

      if (status) {
        orders = orders.filter((o) => o.status === status);
      }

      // Sort by newest first
      orders.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return NextResponse.json({
        success: true,
        data: orders,
        total: orders.length,
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

    let query = supabase
      .from("orders")
      .select("*")
      .eq("creator_id", creatorId);

    if (status) {
      query = query.eq("status", status);
    }

    query = query.order("created_at", { ascending: false });

    const { data: orderRows, error } = await query;

    if (error) {
      console.error("Error fetching orders:", error);
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
      });
    }

    const orders = (orderRows || []).map((row) => mapOrderFromDb(row));

    return NextResponse.json({
      success: true,
      data: orders,
      total: orders.length,
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
    const { productId, buyerEmail, buyerName, paymentMethod, creatorId } = body;

    // Validate required fields
    if (!productId || !buyerEmail || !buyerName || !paymentMethod || !creatorId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: productId, buyerEmail, buyerName, paymentMethod, creatorId" },
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

      // Check if event is sold out
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

      // Create order
      const orderId = crypto.randomUUID();
      const trackingId = `mock-tracking-${crypto.randomUUID()}`;

      const newOrder: Order = {
        id: orderId,
        creatorId,
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
            (c) => c.id === creatorId
          );
          if (creatorIndex >= 0) {
            mockCreators[creatorIndex].balance += creatorEarning;
            mockCreators[creatorIndex].totalEarnings += creatorEarning;
            mockCreators[creatorIndex].totalSales += 1;
          }
        }
      }, 2000);

      // Add to mock orders
      mockOrders.push(newOrder);

      return NextResponse.json({
        success: true,
        data: {
          order: newOrder,
          pesapalTrackingId: trackingId,
          paymentUrl: `/payment/success?orderId=${orderId}&trackingId=${trackingId}`,
        },
      });
    }

    // Real Supabase + Pesapal flow
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Supabase not configured" },
        { status: 500 }
      );
    }

    // Get product from Supabase
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

    // Validate product is active
    if (product.status !== "active") {
      return NextResponse.json(
        { success: false, error: "Product is not available for purchase" },
        { status: 400 }
      );
    }

    // Check event capacity
    if (product.type === "event" && product.capacity !== null) {
      if (product.ticketsSold >= product.capacity) {
        return NextResponse.json(
          { success: false, error: "Event is sold out" },
          { status: 400 }
        );
      }
    }

    const amount = product.price;
    const platformFee = Math.round((amount * PLATFORM_FEE_PERCENT) / 100);
    const creatorEarning = amount - platformFee;
    const orderId = crypto.randomUUID();

    // Register IPN with Pesapal
    const ipnUrl = process.env.PESAPAL_IPN_URL || `${process.env.NEXT_PUBLIC_APP_URL}/api/pesapal/ipn`;
    const ipnId = await registerIPN(ipnUrl);

    // Create order in database
    const serviceClient = createServiceRoleClient();
    if (!serviceClient) {
      return NextResponse.json(
        { success: false, error: "Service unavailable" },
        { status: 500 }
      );
    }

    const { data: orderRow, error: orderError } = await serviceClient
      .from("orders")
      .insert({
        id: orderId,
        product_id: productId,
        creator_id: creatorId,
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

      order.pesapalOrderTrackingId = pesapalResponse.order_tracking_id;
    }

    return NextResponse.json({
      success: true,
      data: {
        order,
        pesapalTrackingId: pesapalResponse?.order_tracking_id || orderId,
        paymentUrl: pesapalResponse?.redirect_url || "",
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
