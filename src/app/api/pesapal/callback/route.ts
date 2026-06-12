// ============================================================
// GET /api/pesapal/callback — Pesapal payment callback redirect
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import {
  isUsingMockData,
  mockOrders,
  mockProducts,
  mockCreators,
  getMockDownloadSessionByOrderId,
} from "@/lib/mock-data";
import { getTransactionStatus } from "@/lib/pesapal";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const orderTrackingId = request.nextUrl.searchParams.get(
      "OrderTrackingId"
    );

    if (!orderTrackingId) {
      // Redirect to cancel page if no tracking ID
      return NextResponse.redirect(
        new URL("/payment/cancel?reason=no_tracking_id", process.env.NEXT_PUBLIC_APP_URL || request.url)
      );
    }

    if (isUsingMockData()) {
      // Find the order by tracking ID
      const order = mockOrders.find(
        (o) => o.pesapalOrderTrackingId === orderTrackingId
      );

      if (!order) {
        return NextResponse.redirect(
          new URL("/payment/cancel?reason=order_not_found", process.env.NEXT_PUBLIC_APP_URL || request.url)
        );
      }

      // Auto-complete the order in mock mode
      const orderIndex = mockOrders.findIndex(
        (o) => o.pesapalOrderTrackingId === orderTrackingId
      );
      if (orderIndex >= 0 && mockOrders[orderIndex].status === "pending") {
        mockOrders[orderIndex] = {
          ...mockOrders[orderIndex],
          status: "completed" as OrderStatus,
          pesapalTransactionId: `mock-txn-${Date.now()}`,
          updatedAt: new Date().toISOString(),
        };

        // Update product sales
        const prodIndex = mockProducts.findIndex(
          (p) => p.id === mockOrders[orderIndex].productId
        );
        if (prodIndex >= 0) {
          mockProducts[prodIndex].salesCount += 1;
          if (mockProducts[prodIndex].type === "event") {
            mockProducts[prodIndex].ticketsSold += 1;
          }
        }

        // Update creator balance
        const creatorIndex = mockCreators.findIndex(
          (c) => c.id === mockOrders[orderIndex].creatorId
        );
        if (creatorIndex >= 0) {
          mockCreators[creatorIndex].balance +=
            mockOrders[orderIndex].creatorEarning;
          mockCreators[creatorIndex].totalEarnings +=
            mockOrders[orderIndex].creatorEarning;
          mockCreators[creatorIndex].totalSales += 1;
        }
      }

      // Find download session for digital products
      const downloadSession = getMockDownloadSessionByOrderId(order.id);
      const downloadTokenParam = downloadSession
        ? `&downloadToken=${downloadSession.downloadToken}`
        : order.downloadToken
          ? `&downloadToken=${order.downloadToken}`
          : "";

      // Redirect to success page with download token
      return NextResponse.redirect(
        new URL(
          `/payment/success?orderId=${order.id}&trackingId=${orderTrackingId}${downloadTokenParam}`,
          process.env.NEXT_PUBLIC_APP_URL || request.url
        )
      );
    }

    // Real Pesapal flow
    const transactionStatus = await getTransactionStatus(orderTrackingId);

    if (!transactionStatus) {
      return NextResponse.redirect(
        new URL("/payment/cancel?reason=status_check_failed", process.env.NEXT_PUBLIC_APP_URL || request.url)
      );
    }

    // Find order by tracking ID from Supabase
    const serviceClient = createServiceRoleClient();
    if (!serviceClient) {
      return NextResponse.redirect(
        new URL("/payment/cancel?reason=service_unavailable", process.env.NEXT_PUBLIC_APP_URL || request.url)
      );
    }

    const { data: orderRow } = await serviceClient
      .from("orders")
      .select("id, status, download_token")
      .eq("pesapal_order_tracking_id", orderTrackingId)
      .single();

    if (!orderRow) {
      return NextResponse.redirect(
        new URL("/payment/cancel?reason=order_not_found", process.env.NEXT_PUBLIC_APP_URL || request.url)
      );
    }

    const orderId = orderRow.id as string;

    if (transactionStatus.payment_status === "COMPLETED") {
      // The IPN handler should process the payment, but as a fallback
      // we also process it here if the order is still pending
      if (orderRow.status === "pending") {
        // IPN will handle the full processing, but for the callback
        // we just redirect the user. The IPN may arrive before or after.
        // For safety, we don't duplicate the processing here.
        console.log("Callback received for pending order, IPN should process:", orderId);
      }

      // Find download session token for digital products
      let downloadTokenParam = "";
      if (orderRow.download_token) {
        // Try to find a download session for this order
        const { data: dlSession } = await serviceClient
          .from("download_sessions")
          .select("download_token")
          .eq("order_id", orderId)
          .limit(1)
          .single();

        if (dlSession) {
          downloadTokenParam = `&downloadToken=${dlSession.download_token}`;
        } else {
          downloadTokenParam = `&downloadToken=${orderRow.download_token}`;
        }
      }

      return NextResponse.redirect(
        new URL(
          `/payment/success?orderId=${orderId}&trackingId=${orderTrackingId}${downloadTokenParam}`,
          process.env.NEXT_PUBLIC_APP_URL || request.url
        )
      );
    }

    if (transactionStatus.payment_status === "PENDING") {
      return NextResponse.redirect(
        new URL(
          `/payment/success?orderId=${orderId}&status=pending`,
          process.env.NEXT_PUBLIC_APP_URL || request.url
        )
      );
    }

    // Payment FAILED or INVALID
    const reason = transactionStatus.payment_status || "payment_failed";
    return NextResponse.redirect(
      new URL(`/payment/cancel?reason=${reason}`, process.env.NEXT_PUBLIC_APP_URL || request.url)
    );
  } catch (error) {
    console.error("Error in pesapal callback GET:", error instanceof Error ? error.message : String(error));
    return NextResponse.redirect(
      new URL("/payment/cancel?reason=server_error", process.env.NEXT_PUBLIC_APP_URL || request.url)
    );
  }
}
