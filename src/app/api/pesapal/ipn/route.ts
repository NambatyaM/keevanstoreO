// ============================================================
// POST /api/pesapal/ipn — Pesapal IPN webhook handler
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { isUsingMockData } from "@/lib/mock-data";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getTransactionStatus } from "@/lib/pesapal";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { OrderTrackingId, OrderNotificationType, OrderMerchantReference } = body;

    console.log("Pesapal IPN received:", {
      OrderTrackingId,
      OrderNotificationType,
      OrderMerchantReference,
    });

    if (isUsingMockData()) {
      // In mock mode, just acknowledge
      return NextResponse.json({
        success: true,
        message: "IPN received (mock mode)",
      });
    }

    // Real Pesapal IPN handling
    if (!OrderTrackingId) {
      return NextResponse.json(
        { success: false, error: "Missing OrderTrackingId" },
        { status: 400 }
      );
    }

    const serviceClient = createServiceRoleClient();
    if (!serviceClient) {
      console.error("Service role client not available for IPN processing");
      return NextResponse.json(
        { success: false, error: "Service unavailable" },
        { status: 500 }
      );
    }

    // Find the order by pesapal_order_tracking_id
    const { data: orderRow, error: orderError } = await serviceClient
      .from("orders")
      .select("*")
      .eq("pesapal_order_tracking_id", OrderTrackingId)
      .single();

    if (orderError || !orderRow) {
      console.error("Order not found for tracking ID:", OrderTrackingId);
      // Still return 200 to acknowledge receipt
      return NextResponse.json({
        success: true,
        message: "IPN received but order not found",
      });
    }

    // Idempotency check: if order is already completed, skip processing
    if (orderRow.status === "completed") {
      console.log("Order already completed, skipping:", orderRow.id);
      return NextResponse.json({
        success: true,
        message: "IPN received, order already processed",
      });
    }

    // Get the actual transaction status from Pesapal
    const transactionStatus = await getTransactionStatus(OrderTrackingId);

    if (!transactionStatus) {
      console.error("Failed to get transaction status for:", OrderTrackingId);
      return NextResponse.json({
        success: true,
        message: "IPN received, status check pending",
      });
    }

    if (transactionStatus.payment_status === "COMPLETED") {
      // Use the atomic process_completed_payment RPC function
      // This handles order status, creator balance, product sales count, and event tickets atomically
      // preventing TOCTOU race conditions from concurrent IPN callbacks
      const { error: rpcError } = await serviceClient.rpc("process_completed_payment", {
        p_order_id: orderRow.id,
        p_pesapal_transaction_id: transactionStatus.confirmation_code || "",
      });

      if (rpcError) {
        console.error("process_completed_payment RPC failed:", rpcError.message);
        // If RPC fails (e.g., order not found or already completed), it's not a server error
        // The RPC has its own idempotency check
      }

      const productId = orderRow.product_id;

      // For digital products: generate download token and session if not already set
      if (orderRow.download_token === null) {
        const { data: productTypeData } = await serviceClient
          .from("products")
          .select("type")
          .eq("id", productId)
          .single();

        if (productTypeData?.type === "digital") {
          const downloadToken = `dl-${crypto.randomUUID()}`;
          await serviceClient
            .from("orders")
            .update({
              download_token: downloadToken,
            })
            .eq("id", orderRow.id);

          // Create a download session for the digital product
          await serviceClient
            .from("download_sessions")
            .insert({
              order_id: orderRow.id,
              product_id: productId,
              download_token: crypto.randomUUID(),
              expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              max_downloads: 5,
            });
        }

        // For events: create a ticket record (RPC handles tickets_sold increment)
        if (productTypeData?.type === "event") {
          // Look up the events table row to get the correct event ID
          // (productId points to the products table, but tickets.event_id references events.id)
          const { data: eventData } = await serviceClient
            .from("events")
            .select("id")
            .eq("product_id", productId)
            .single();

          if (eventData) {
            await serviceClient.from("tickets").insert({
              order_id: orderRow.id,
              event_id: eventData.id,
              qr_code_data: `QR-${orderRow.id}`,
            });
          } else {
            console.error("Event not found for product ID:", productId, "— ticket not created");
          }
        }
      }

      console.log("Payment completed for order:", orderRow.id);
    } else if (transactionStatus.payment_status === "FAILED") {
      // Update order status to failed
      await serviceClient
        .from("orders")
        .update({
          status: "failed",
        })
        .eq("id", orderRow.id);

      console.log("Payment failed for order:", orderRow.id);
    }
    // For PENDING or other statuses, do nothing — wait for another IPN

    // Return the expected Pesapal IPN response format
    return NextResponse.json({
      success: true,
      message: "IPN received",
      orderTrackingId: OrderTrackingId,
      orderNotificationType: OrderNotificationType,
      orderMerchantReference: OrderMerchantReference,
    });
  } catch (error) {
    console.error("Error processing Pesapal IPN:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Pesapal also sends GET requests for IPN registration confirmation
export async function GET(request: NextRequest) {
  const orderTrackingId = request.nextUrl.searchParams.get("OrderTrackingId");
  const orderMerchantReference = request.nextUrl.searchParams.get("OrderMerchantReference");

  console.log("Pesapal IPN GET confirmation:", {
    orderTrackingId,
    orderMerchantReference,
  });

  return NextResponse.json({
    success: true,
    orderTrackingId,
    orderMerchantReference,
  });
}
