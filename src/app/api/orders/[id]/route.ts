// ============================================================
// GET /api/orders/[id] — Get order by ID
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { isUsingMockData, getMockOrderById } from "@/lib/mock-data";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (isUsingMockData()) {
      const order = getMockOrderById(id);
      if (!order) {
        return NextResponse.json(
          { success: false, error: "Order not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: order });
    }

    // Real Supabase query
    return NextResponse.json(
      { success: false, error: "Order not found" },
      { status: 404 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
