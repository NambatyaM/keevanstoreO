// ============================================================
// GET/POST /api/pesapal/ipn — Pesapal IPN webhook handler
// ============================================================
// 
// Pesapal hits this endpoint in the background whenever payment status changes.
// It may send either GET or POST requests with:
// - OrderTrackingId
// - OrderMerchantReference
// - OrderNotificationType (value will be "IPNCHANGE")
//
// This endpoint:
// 1. Extracts OrderTrackingId and OrderMerchantReference (query for GET, body for POST)
// 2. Calls getTransactionStatus() to get the real payment status
// 3. Finds the matching order by merchant_reference
// 4. Updates the order status accordingly
// 5. If COMPLETED and was PENDING, triggers delivery
// 6. Logs the IPN event to pesapal_ipn_logs table
// 7. Returns 200 OK (Pesapal expects this, otherwise it will retry)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getTransactionStatus } from "@/lib/pesapal";
import { createServiceRoleClient } from "@/lib/supabase/server";

async function processIPN(
  orderTrackingId: string,
  orderMerchantReference: string,
  orderNotificationType: string
): Promise<NextResponse> {
  console.log("Pesapal IPN received:", {
    orderTrackingId,
    orderMerchantReference,
    orderNotificationType,
  });

  const supabase = createServiceRoleClient();
  if (!supabase) {
    console.error("Failed to connect to Supabase for IPN processing");
    return NextResponse.json(
      { success: false, error: "Service unavailable" },
      { status: 500 }
    );
  }

  // Find order by merchant reference
  const { data: orderRow, error: orderError } = await supabase
    .from("orders")
    .select("id, status, product_id, creator_id, amount, creator_earning")
    .eq("merchant_reference", orderMerchantReference)
    .single();

  if (orderError || !orderRow) {
    console.error("Order not found for merchant reference:", orderMerchantReference);
    // Log the IPN event even if order not found
    await supabase.from("pesapal_ipn_logs").insert({
      order_tracking_id: orderTrackingId,
      merchant_reference: orderMerchantReference,
      raw_status: "ORDER_NOT_FOUND",
      received_at: new Date().toISOString(),
    });
    // Return 200 to acknowledge receipt
    return NextResponse.json({ success: true, message: "IPN received" });
  }

  const orderId = orderRow.id as string;
  const productId = orderRow.product_id as string;
  const creatorId = orderRow.creator_id as string;

  // Idempotency check: if order is already completed, skip processing
  if (orderRow.status === "completed") {
    console.log("Order already completed, skipping IPN processing:", orderId);
    await supabase.from("pesapal_ipn_logs").insert({
      order_tracking_id: orderTrackingId,
      merchant_reference: orderMerchantReference,
      raw_status: "ALREADY_COMPLETED",
      received_at: new Date().toISOString(),
    });
    return NextResponse.json({ success: true, message: "IPN received, order already processed" });
  }

  // Get transaction status from Pesapal
  const transactionStatus = await getTransactionStatus(orderTrackingId);

  if (!transactionStatus) {
    console.error("Failed to get transaction status for:", orderTrackingId);
    // Log the failure
    await supabase.from("pesapal_ipn_logs").insert({
      order_tracking_id: orderTrackingId,
      merchant_reference: orderMerchantReference,
      raw_status: "STATUS_CHECK_FAILED",
      received_at: new Date().toISOString(),
    });
    // Return 500 to trigger Pesapal retry
    return NextResponse.json(
      { success: false, error: "Failed to verify payment status" },
      { status: 500 }
    );
  }

  // Map Pesapal status to our status
  const pesapalStatus = transactionStatus.payment_status_description || transactionStatus.payment_status;
  let newStatus: string;

  switch (pesapalStatus) {
    case "COMPLETED":
      newStatus = "completed";
      break;
    case "FAILED":
    case "INVALID":
    case "REVERSED":
      newStatus = "failed";
      break;
    case "PENDING":
      newStatus = "pending";
      break;
    default:
      newStatus = "pending";
  }

  // Update order status in Supabase
  const { error: updateError } = await supabase
    .from("orders")
    .update({
      status: newStatus,
      pesapal_transaction_id: transactionStatus.confirmation_code,
      pesapal_payment_method: transactionStatus.payment_method,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (updateError) {
    console.error("Failed to update order status:", updateError);
  }

  // Log the IPN event
  await supabase.from("pesapal_ipn_logs").insert({
    order_tracking_id: orderTrackingId,
    merchant_reference: orderMerchantReference,
    raw_status: pesapalStatus,
    received_at: new Date().toISOString(),
  });

  // If payment completed and was previously pending, trigger delivery logic
  if (newStatus === "completed" && orderRow.status === "pending") {
    // Update product sales count
    await supabase
      .from("products")
      .update({
        sales_count: (await supabase.from("products").select("sales_count").eq("id", productId).single()).data?.sales_count || 0 + 1,
      })
      .eq("id", productId);

    // Update creator balance and earnings
    const creatorEarning = Number(orderRow.creator_earning);
    await supabase
      .from("creators")
      .update({
        balance: (await supabase.from("creators").select("balance").eq("id", creatorId).single()).data?.balance || 0 + creatorEarning,
        total_earnings: (await supabase.from("creators").select("total_earnings").eq("id", creatorId).single()).data?.total_earnings || 0 + creatorEarning,
        total_sales: (await supabase.from("creators").select("total_sales").eq("id", creatorId).single()).data?.total_sales || 0 + 1,
      })
      .eq("id", creatorId);

    // Create download session for digital products
    const { data: productData } = await supabase
      .from("products")
      .select("type")
      .eq("id", productId)
      .single();

    if (productData?.type === "digital") {
      const downloadToken = crypto.randomUUID();
      await supabase
        .from("download_sessions")
        .insert({
          download_token: downloadToken,
          product_id: productId,
          order_id: orderId,
          buyer_email: transactionStatus.description || "unknown",
          max_downloads: 3,
          download_count: 0,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        });
    }

    console.log("Payment completed and delivery triggered for order:", orderId);
  }

  return NextResponse.json({ success: true, message: "IPN processed" });
}

// Handle POST requests
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { OrderTrackingId, OrderMerchantReference, OrderNotificationType } = body;

    if (!OrderTrackingId || !OrderMerchantReference) {
      return NextResponse.json(
        { success: false, error: "Missing OrderTrackingId or OrderMerchantReference" },
        { status: 400 }
      );
    }

    return await processIPN(OrderTrackingId, OrderMerchantReference, OrderNotificationType || "IPNCHANGE");
  } catch (error) {
    console.error("Error processing Pesapal IPN POST:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle GET requests
export async function GET(request: NextRequest) {
  try {
    const orderTrackingId = request.nextUrl.searchParams.get("OrderTrackingId");
    const orderMerchantReference = request.nextUrl.searchParams.get("OrderMerchantReference");
    const orderNotificationType = request.nextUrl.searchParams.get("OrderNotificationType");

    if (!orderTrackingId || !orderMerchantReference) {
      return NextResponse.json(
        { success: false, error: "Missing OrderTrackingId or OrderMerchantReference" },
        { status: 400 }
      );
    }

    return await processIPN(orderTrackingId, orderMerchantReference, orderNotificationType || "IPNCHANGE");
  } catch (error) {
    console.error("Error processing Pesapal IPN GET:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
