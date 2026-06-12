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
      const creatorEarning = Number(orderRow.creator_earning);
      const creatorId = orderRow.creator_id;
      const productId = orderRow.product_id;

      // Update order status to completed
      await serviceClient
        .from("orders")
        .update({
          status: "completed",
          pesapal_transaction_id: transactionStatus.confirmation_code,
        })
        .eq("id", orderRow.id);

      // Update creator balance and total_earnings (service role bypasses RLS)
      const { data: creatorData } = await serviceClient
        .from("creators")
        .select("balance, total_earnings, total_sales")
        .eq("id", creatorId)
        .single();

      if (creatorData) {
        await serviceClient
          .from("creators")
          .update({
            balance: Number(creatorData.balance) + creatorEarning,
            total_earnings: Number(creatorData.total_earnings) + creatorEarning,
            total_sales: Number(creatorData.total_sales) + 1,
          })
          .eq("id", creatorId);
      }

      // Update product sales_count
      const { data: productData } = await serviceClient
        .from("products")
        .select("sales_count, type")
        .eq("id", productId)
        .single();

      if (productData) {
        const productUpdates: Record<string, unknown> = {
          sales_count: Number(productData.sales_count) + 1,
        };

        await serviceClient
          .from("products")
          .update(productUpdates)
          .eq("id", productId);

        // For events: increment tickets_sold and create ticket record
        if (productData.type === "event") {
          const { data: eventData } = await serviceClient
            .from("events")
            .select("tickets_sold")
            .eq("product_id", productId)
            .single();

          if (eventData) {
            await serviceClient
              .from("events")
              .update({
                tickets_sold: Number(eventData.tickets_sold) + 1,
              })
              .eq("product_id", productId);
          }

          // Create a ticket record for this event purchase
          await serviceClient.from("tickets").insert({
            order_id: orderRow.id,
            event_id: productId,
            buyer_email: orderRow.buyer_email,
            buyer_name: orderRow.buyer_name,
            qr_code_data: `QR-${orderRow.id}`,
          });
        }
      }

      // For digital products: generate download token if not already set
      if (orderRow.download_token === null && productData?.type === "digital") {
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
  } catch {
    console.error("Error processing Pesapal IPN");
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
