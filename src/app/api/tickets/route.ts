// ============================================================
// GET /api/tickets — Get tickets for an event (by product_id)
// POST /api/tickets — Check-in or undo check-in for a ticket
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import {
  isUsingMockData,
  getMockTickets,
  mockTickets,
  getMockProductById,
} from "@/lib/mock-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Ticket } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const productId = request.nextUrl.searchParams.get("product_id");

    if (!productId) {
      return NextResponse.json(
        { success: false, error: "product_id is required" },
        { status: 400 }
      );
    }

    if (isUsingMockData()) {
      const tickets = getMockTickets(productId).sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return NextResponse.json({
        success: true,
        data: tickets,
        total: tickets.length,
      });
    }

    // Real Supabase query
    // NOTE: Full ticket/check-in backend integration requires a dedicated
    // tickets table in Supabase. This is a placeholder for the real flow.
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
      });
    }

    // Verify the product exists and is an event
    const { data: productRow } = await supabase
      .from("products")
      .select("id, type, creator_id")
      .eq("id", productId)
      .single();

    if (!productRow || productRow.type !== "event") {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 }
      );
    }

    // Fetch orders for this product that are completed (those represent tickets)
    const { data: orderRows, error } = await supabase
      .from("orders")
      .select("id, buyer_email, buyer_name, created_at")
      .eq("product_id", productId)
      .eq("status", "completed")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tickets:", error);
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
      });
    }

    // Map orders to tickets (a proper tickets table would be better)
    const tickets: Ticket[] = (orderRows || []).map((row) => ({
      id: row.id,
      orderId: row.id,
      productId,
      buyerEmail: row.buyer_email,
      buyerName: row.buyer_name,
      qrCode: `QR-${row.id.slice(0, 8).toUpperCase()}`,
      checkedIn: false,
      checkedInAt: null,
      createdAt: row.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: tickets,
      total: tickets.length,
    });
  } catch (error) {
    console.error("Error in tickets GET:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticketId, action } = body;

    if (!ticketId || !action) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: ticketId, action (checkin|undo)",
        },
        { status: 400 }
      );
    }

    if (action !== "checkin" && action !== "undo") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid action. Must be 'checkin' or 'undo'",
        },
        { status: 400 }
      );
    }

    if (isUsingMockData()) {
      const ticketIndex = mockTickets.findIndex((t) => t.id === ticketId);
      if (ticketIndex < 0) {
        return NextResponse.json(
          { success: false, error: "Ticket not found" },
          { status: 404 }
        );
      }

      if (action === "checkin") {
        mockTickets[ticketIndex].checkedIn = true;
        mockTickets[ticketIndex].checkedInAt = new Date().toISOString();
      } else {
        mockTickets[ticketIndex].checkedIn = false;
        mockTickets[ticketIndex].checkedInAt = null;
      }

      return NextResponse.json({
        success: true,
        data: mockTickets[ticketIndex],
      });
    }

    // Real Supabase flow
    // NOTE: Full check-in backend integration requires a dedicated tickets
    // table with check_in_at and checked_in columns in Supabase.
    // This is a placeholder — the actual DB schema and RLS policies
    // need to be created before this endpoint can work in production.
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Supabase not configured" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "Check-in requires a dedicated tickets table in Supabase. " +
          "Please set up the tickets schema and re-enable this endpoint.",
      },
      { status: 501 }
    );
  } catch (error) {
    console.error("Error in tickets POST:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
