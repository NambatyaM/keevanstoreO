// ============================================================
// GET /api/pesapal/callback — Pesapal payment callback redirect
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import {
  isUsingMockData,
  mockOrders,
  mockProducts,
  mockCreators,
  getMockOrderById,
} from "@/lib/mock-data";
import { getTransactionStatus } from "@/lib/pesapal";
import type { OrderStatus } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const orderTrackingId = request.nextUrl.searchParams.get(
      "OrderTrackingId"
    );
    const orderNotificationType = request.nextUrl.searchParams.get(
      "OrderNotificationType"
    );

    if (!orderTrackingId) {
      // Redirect to cancel page if no tracking ID
      return NextResponse.redirect(
        new URL("/payment/cancel?reason=no_tracking_id", request.url)
      );
    }

    if (isUsingMockData()) {
      // Find the order by tracking ID
      const order = mockOrders.find(
        (o) => o.pesapalOrderTrackingId === orderTrackingId
      );

      if (!order) {
        return NextResponse.redirect(
          new URL("/payment/cancel?reason=order_not_found", request.url)
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

      // Redirect to success page
      return NextResponse.redirect(
        new URL(
          `/payment/success?orderId=${order.id}&trackingId=${orderTrackingId}`,
          request.url
        )
      );
    }

    // Real Pesapal flow
    const transactionStatus = await getTransactionStatus(orderTrackingId);

    if (!transactionStatus) {
      return NextResponse.redirect(
        new URL("/payment/cancel?reason=status_check_failed", request.url)
      );
    }

    // Find order by tracking ID
    const order = mockOrders.find(
      (o) => o.pesapalOrderTrackingId === orderTrackingId
    );

    if (
      transactionStatus.payment_status === "COMPLETED" &&
      order
    ) {
      // Update order status
      const orderIndex = mockOrders.findIndex(
        (o) => o.pesapalOrderTrackingId === orderTrackingId
      );
      if (orderIndex >= 0) {
        mockOrders[orderIndex] = {
          ...mockOrders[orderIndex],
          status: "completed" as OrderStatus,
          pesapalTransactionId: transactionStatus.confirmation_code,
          updatedAt: new Date().toISOString(),
        };
      }

      return NextResponse.redirect(
        new URL(
          `/payment/success?orderId=${order.id}&trackingId=${orderTrackingId}`,
          request.url
        )
      );
    }

    // Payment failed or not completed
    return NextResponse.redirect(
      new URL("/payment/cancel?reason=payment_failed", request.url)
    );
  } catch {
    return NextResponse.redirect(
      new URL("/payment/cancel?reason=server_error", request.url)
    );
  }
}
