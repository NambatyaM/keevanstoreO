// ============================================================
// GET /api/pesapal/callback — Pesapal payment callback redirect
// ============================================================
// 
// Pesapal redirects the user here after payment with these query params:
// - OrderTrackingId
// - OrderMerchantReference
// - OrderNotificationType (value will be "CALLBACKURL")
//
// This endpoint:
// 1. Extracts OrderTrackingId and OrderMerchantReference from query
// 2. Calls getTransactionStatus() to get the real payment status
// 3. Updates the Supabase order record with the status
// 4. Redirects user to order status page
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getTransactionStatus } from "@/lib/pesapal";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const orderTrackingId = request.nextUrl.searchParams.get("OrderTrackingId");
    const orderMerchantReference = request.nextUrl.searchParams.get("OrderMerchantReference");
    const orderNotificationType = request.nextUrl.searchParams.get("OrderNotificationType");

    if (!orderTrackingId || !orderMerchantReference) {
      console.error("Missing callback parameters:", { orderTrackingId, orderMerchantReference });
      return NextResponse.redirect(
        new URL("/payment/cancel?reason=missing_params", process.env.NEXT_PUBLIC_APP_URL || request.url)
      );
    }

    // Get transaction status from Pesapal
    const transactionStatus = await getTransactionStatus(orderTrackingId);

    if (!transactionStatus) {
      console.error("Failed to get transaction status for:", orderTrackingId);
      return NextResponse.redirect(
        new URL("/payment/cancel?reason=status_check_failed", process.env.NEXT_PUBLIC_APP_URL || request.url)
      );
    }

    // Connect to Supabase
    const supabase = createServiceRoleClient();
    if (!supabase) {
      console.error("Failed to connect to Supabase");
      return NextResponse.redirect(
        new URL("/payment/cancel?reason=service_unavailable", process.env.NEXT_PUBLIC_APP_URL || request.url)
      );
    }

    // Find order by merchant reference
    const { data: orderRow, error: orderError } = await supabase
      .from("orders")
      .select("id, status, product_id, creator_id")
      .eq("merchant_reference", orderMerchantReference)
      .single();

    if (orderError || !orderRow) {
      console.error("Order not found for merchant reference:", orderMerchantReference);
      return NextResponse.redirect(
        new URL("/payment/cancel?reason=order_not_found", process.env.NEXT_PUBLIC_APP_URL || request.url)
      );
    }

    const orderId = orderRow.id as string;
    const productId = orderRow.product_id as string;
    const creatorId = orderRow.creator_id as string;

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
      // Continue anyway - we'll redirect the user
    }

    // If payment completed, trigger delivery logic
    if (newStatus === "completed" && orderRow.status === "pending") {
      // Update product sales count
      await supabase
        .from("products")
        .update({
          sales_count: (await supabase.from("products").select("sales_count").eq("id", productId).single()).data?.sales_count || 0 + 1,
        })
        .eq("id", productId);

      // Update creator balance and earnings
      const { data: orderData } = await supabase
        .from("orders")
        .select("creator_earning")
        .eq("id", orderId)
        .single();

      if (orderData) {
        await supabase
          .from("creators")
          .update({
            balance: (await supabase.from("creators").select("balance").eq("id", creatorId).single()).data?.balance || 0 + Number(orderData.creator_earning),
            total_earnings: (await supabase.from("creators").select("total_earnings").eq("id", creatorId).single()).data?.total_earnings || 0 + Number(orderData.creator_earning),
            total_sales: (await supabase.from("creators").select("total_sales").eq("id", creatorId).single()).data?.total_sales || 0 + 1,
          })
          .eq("id", creatorId);
      }

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
    }

    // Redirect user to order status page
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.url;
    const redirectUrl = new URL(`/order-status?ref=${orderMerchantReference}`, baseUrl);
    
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Error in pesapal callback:", error);
    return NextResponse.redirect(
      new URL("/payment/cancel?reason=server_error", process.env.NEXT_PUBLIC_APP_URL || request.url)
    );
  }
}
