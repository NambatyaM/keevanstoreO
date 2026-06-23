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
    let { OrderTrackingId, OrderNotificationType, OrderMerchantReference } = body;

    // Pesapal may send OrderTrackingId in query params in some configurations
    if (!OrderTrackingId) {
      OrderTrackingId = request.nextUrl.searchParams.get("OrderTrackingId") || undefined;
    }
    if (!OrderMerchantReference) {
      OrderMerchantReference = request.nextUrl.searchParams.get("OrderMerchantReference") || undefined;
    }

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
    // Require at least one of: OrderTrackingId or OrderMerchantReference
    if (!OrderTrackingId && !OrderMerchantReference) {
      return NextResponse.json(
        { success: false, error: "Missing OrderTrackingId and OrderMerchantReference" },
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

    // Find the order — prefer OrderTrackingId, fall back to OrderMerchantReference (order ID)
    let orderRow: Record<string, unknown> | null = null;
    let orderError: unknown = null;

    if (OrderTrackingId) {
      const result = await serviceClient
        .from("orders")
        .select("*")
        .eq("pesapal_order_tracking_id", OrderTrackingId)
        .single();
      orderRow = result.data;
      orderError = result.error;
    }

    // Fallback: look up by order ID (OrderMerchantReference = the orderId we sent to Pesapal)
    if ((!orderRow || orderError) && OrderMerchantReference) {
      const result = await serviceClient
        .from("orders")
        .select("*")
        .eq("id", OrderMerchantReference)
        .single();
      orderRow = result.data;
      orderError = result.error;
    }

    if (orderError || !orderRow) {
      console.error("Order not found for tracking ID:", OrderTrackingId, "/ reference:", OrderMerchantReference);
      // Still return 200 to acknowledge receipt
      return NextResponse.json({
        success: true,
        message: "IPN received but order not found",
      });
    }

    // Idempotency check: if order is already completed, skip processing
    if ((orderRow as Record<string, unknown>).status === "completed") {
      console.log("Order already completed, skipping:", orderRow.id);
      return NextResponse.json({
        success: true,
        message: "IPN received, order already processed",
      });
    }

    // Get the actual transaction status from Pesapal
    // Use the tracking ID from the IPN body, or fall back to the one stored on the order
    const trackingIdForStatus = OrderTrackingId || (orderRow.pesapal_order_tracking_id as string | null);

    if (!trackingIdForStatus) {
      console.error("No tracking ID available to verify payment status for order:", orderRow.id);
      return NextResponse.json(
        { success: false, error: "Cannot verify payment status without tracking ID, will retry" },
        { status: 500 }
      );
    }

    const transactionStatus = await getTransactionStatus(trackingIdForStatus);

    if (!transactionStatus) {
      console.error("Failed to get transaction status for:", trackingIdForStatus, "— returning 500 to trigger Pesapal retry");
      // Return 500 so Pesapal retries the IPN notification
      return NextResponse.json(
        { success: false, error: "Failed to verify payment status, will retry" },
        { status: 500 }
      );
    }

    if (transactionStatus.payment_status === "COMPLETED") {
      // FIXED: Use ledger-based RPC functions for production-grade financial tracking
      // Handle donations separately - if product_id is null, this is a donation
      if (!orderRow.product_id) {
        // This is a donation - use the ledger-based process_donation_ledger RPC
        const { error: donationRpcError } = await serviceClient.rpc("process_donation_ledger", {
          p_order_id: orderRow.id,
          p_pesapal_transaction_id: transactionStatus.confirmation_code || "",
        });

        if (donationRpcError) {
          console.error("process_donation_ledger RPC failed:", donationRpcError.message);
          // Return 500 to trigger Pesapal retry
          return NextResponse.json(
            { success: false, error: "Donation processing failed, will retry" },
            { status: 500 }
          );
        }
      } else {
        // This is a product purchase - use the ledger-based process_completed_payment_ledger RPC function
        // This atomically creates ledger entries for: SALE_COMPLETED, COMMISSION_DEDUCTED, CREATOR_EARNING_CREDITED
        // preventing TOCTOU race conditions from concurrent IPN callbacks
        const { error: rpcError } = await serviceClient.rpc("process_completed_payment_ledger", {
          p_order_id: orderRow.id,
          p_pesapal_transaction_id: transactionStatus.confirmation_code || "",
        });

        if (rpcError) {
          console.error("process_completed_payment_ledger RPC failed:", rpcError.message);
          // Only swallow idempotency errors (order already completed)
          // For all other errors, return 500 to trigger Pesapal retry
          if (!rpcError.message.includes("already completed") && !rpcError.message.includes("already processed")) {
            return NextResponse.json(
              { success: false, error: "Payment processing failed, will retry" },
              { status: 500 }
            );
          }
        }
      }

      const productId = orderRow.product_id;

      // FIXED: Handle donations that are part of product purchases using ledger
      // Check if there's a donation record linked to this order
      if (productId) {
        const { data: donationRecord } = await serviceClient
          .from("donations")
          .select("amount")
          .eq("order_id", orderRow.id)
          .maybeSingle();

        if (donationRecord) {
          // Create ledger entry for donation portion of purchase
          // Donations have no platform fee, so full amount goes to creator
          const { error: donationLedgerError } = await serviceClient.rpc("create_ledger_entry", {
            p_creator_id: orderRow.creator_id,
            p_transaction_type: "DONATION_RECEIVED",
            p_amount: donationRecord.amount,
            p_reference_id: orderRow.id,
            p_reference_type: "order",
            p_description: "Donation with product purchase from " + orderRow.buyer_email,
            p_metadata: {
              order_id: orderRow.id,
              donation_amount: donationRecord.amount,
              donor_email: orderRow.buyer_email
            }
          });
          
          if (donationLedgerError) {
            console.error("Failed to create donation ledger entry:", donationLedgerError.message);
          }
          
          // Update donation_current on creators table for display purposes
          const { error: donationUpdateError } = await serviceClient
            .from("creators")
            .update({
              donation_current: (orderRow.donation_current || 0) + donationRecord.amount,
            })
            .eq("id", orderRow.creator_id);
            
          if (donationUpdateError) {
            console.error("Failed to increment donation_current:", donationUpdateError.message);
          }
        }

        // For digital products: create download session if not already created
        // Check the download_sessions table, not the download_token field on the order
        // (download_token is pre-assigned at order creation, but the session is only created after payment)
        const { data: productTypeData } = await serviceClient
          .from("products")
          .select("type")
          .eq("id", productId)
          .single();

        if (productTypeData?.type === "digital") {
          // Check if a download session already exists (idempotency)
          const { data: existingSession } = await serviceClient
            .from("download_sessions")
            .select("id")
            .eq("order_id", orderRow.id)
            .maybeSingle();

          if (!existingSession) {
            // Use the pre-assigned download_token from the order, or generate a new one
            const downloadToken = orderRow.download_token || `dl-${crypto.randomUUID()}`;

            // Ensure the order has a download_token stored
            if (!orderRow.download_token) {
              await serviceClient
                .from("orders")
                .update({ download_token: downloadToken })
                .eq("id", orderRow.id);
            }

            // Create the download session
            await serviceClient
              .from("download_sessions")
              .insert({
                order_id: orderRow.id,
                product_id: productId,
                download_token: downloadToken,
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                max_downloads: 5,
              });
          }
        }

        // For events: create a ticket record if not already created
        if (productTypeData?.type === "event") {
          // Check if a ticket already exists for this order (idempotency)
          const { data: existingTicket } = await serviceClient
            .from("tickets")
            .select("id")
            .eq("order_id", orderRow.id)
            .maybeSingle();

          if (!existingTicket) {
            const { data: eventData } = await serviceClient
              .from("events")
              .select("id")
              .eq("product_id", productId)
              .single();

            if (eventData) {
              await serviceClient.from("tickets").insert({
                order_id: orderRow.id,
                event_id: eventData.id,
                buyer_email: orderRow.buyer_email,
                buyer_name: orderRow.buyer_name,
                qr_code_data: `QR-${orderRow.id}`,
              });
            } else {
              console.error("Event not found for product ID:", productId, "— ticket not created");
            }
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
