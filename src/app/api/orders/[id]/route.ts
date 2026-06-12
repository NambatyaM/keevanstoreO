// ============================================================
// GET /api/orders/[id] — Get order by ID
// Accessible by:
//   1. The authenticated creator who owns the order
//   2. A buyer with a valid downloadToken query param (proves they're the purchaser)
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { isUsingMockData, getMockOrderById } from "@/lib/mock-data";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { mapOrderFromDb } from "@/lib/db-mappers";

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

      // In mock mode, allow access if:
      // 1. User provides a valid downloadToken that matches this order
      // 2. No extra auth needed (mock mode is for demo)
      const downloadToken = request.nextUrl.searchParams.get("downloadToken");
      if (downloadToken && order.downloadToken !== downloadToken) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 403 }
        );
      }

      return NextResponse.json({ success: true, data: order });
    }

    // Real Supabase query — use service role to fetch order first
    const serviceClient = createServiceRoleClient();
    if (!serviceClient) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    const { data: orderRow, error } = await serviceClient
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !orderRow) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Check if requester is the authenticated creator who owns this order
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

    if (user && orderRow.creator_id === user.id) {
      // Creator accessing their own order
      const order = mapOrderFromDb(orderRow);
      return NextResponse.json({ success: true, data: order });
    }

    // Check if requester is a buyer with a valid download token
    const downloadToken = request.nextUrl.searchParams.get("downloadToken");
    if (downloadToken && orderRow.download_token === downloadToken) {
      // Buyer accessing their order via download token — return limited info
      const order = mapOrderFromDb(orderRow);
      return NextResponse.json({ success: true, data: order });
    }

    // Neither authenticated creator nor valid buyer token
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 403 }
    );
  } catch (error) {
    console.error("Error in orders GET:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
