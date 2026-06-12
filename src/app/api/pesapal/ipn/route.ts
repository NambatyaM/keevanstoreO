// ============================================================
// POST /api/pesapal/ipn — Pesapal IPN webhook handler
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { isUsingMockData } from "@/lib/mock-data";

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

    // Real Pesapal IPN handling:
    // 1. Verify the notification
    // 2. Get transaction status from Pesapal
    // 3. Update order in database
    // 4. Handle completion/failure/refund

    return NextResponse.json({
      success: true,
      message: "IPN received",
    });
  } catch {
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
