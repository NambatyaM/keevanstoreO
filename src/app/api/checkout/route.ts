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
} from "@/lib/mock-data";
import { PLATFORM_FEE_PERCENT, CREATOR_EARNING_PERCENT } from "@/lib/constants";
import { submitOrder } from "@/lib/pesapal";
import type { Order, OrderStatus, PaymentMethod } from "@/types";

export async function POST(request: NextRequest) {
  try {
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
    const orderId = `order-${Date.now()}`;
    const trackingId = `checkout-tracking-${Date.now()}`;

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
      downloadToken: product.type === "digital" ? `dl-token-${Date.now()}` : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isUsingMockData()) {
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

    // Real Pesapal flow
    const pesapalResponse = await submitOrder({
      id: orderId,
      currency: product.currency,
      amount,
      description: `Purchase: ${product.title}`,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/pesapal/callback`,
      notification_id: trackingId,
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

    // Update order with actual tracking ID
    if (pesapalResponse?.order_tracking_id) {
      newOrder.pesapalOrderTrackingId = pesapalResponse.order_tracking_id;
    }

    return NextResponse.json({
      success: true,
      data: {
        orderId,
        paymentUrl: pesapalResponse?.redirect_url || "",
        status: "pending",
        order: newOrder,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
