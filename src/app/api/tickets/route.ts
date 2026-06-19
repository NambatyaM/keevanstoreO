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
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
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
    // Try to use the proper tickets table first (linked via events)
    const { data: eventRow } = await supabase
      .from("events")
      .select("id")
      .eq("product_id", productId)
      .single();

    if (eventRow) {
      // Use the proper tickets table
      const { data: ticketRows, error: ticketError } = await supabase
        .from("tickets")
        .select("*")
        .eq("event_id", eventRow.id);

      if (ticketError) {
        console.error("Error fetching tickets:", ticketError);
      }

      if (ticketRows && ticketRows.length > 0) {
        const tickets: Ticket[] = ticketRows.map((row) => ({
          id: row.id,
          orderId: row.order_id,
          eventId: row.event_id,
          productId,
          buyerEmail: row.buyer_email ?? "",
          buyerName: row.buyer_name ?? "",
          qrCode: row.qr_code_data ?? "",
          checkedIn: row.checked_in ?? false,
          checkedInAt: row.checked_in_at ?? null,
          createdAt: row.created_at ?? new Date().toISOString(),
        }));

        return NextResponse.json({
          success: true,
          data: tickets,
          total: tickets.length,
        });
      }
    }

    // Fallback: map orders to tickets (for products without events table entries)
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

    // Map orders to tickets as fallback
    const tickets: Ticket[] = (orderRows || []).map((row) => ({
      id: row.id,
      orderId: row.id,
      eventId: eventRow?.id ?? "",
      productId,
      buyerEmail: row.buyer_email ?? "",
      buyerName: row.buyer_name ?? "",
      qrCode: `QR-${row.id.slice(0, 8).toUpperCase()}`,
      checkedIn: false,
      checkedInAt: null,
      createdAt: row.created_at ?? new Date().toISOString(),
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
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Supabase not configured" },
        { status: 500 }
      );
    }

    // Verify authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const serviceClient = createServiceRoleClient();
    if (!serviceClient) {
      return NextResponse.json(
        { success: false, error: "Supabase not configured" },
        { status: 500 }
      );
    }

    // Get the ticket from the tickets table
    const { data: ticketRow, error: fetchError } = await serviceClient
      .from("tickets")
      .select("*, events!inner(product_id, creator_id)")
      .eq("id", ticketId)
      .single();

    if (fetchError || !ticketRow) {
      return NextResponse.json(
        { success: false, error: "Ticket not found" },
        { status: 404 }
      );
    }

    // Ownership check: only the event creator can check in attendees
    const eventData = ticketRow.events as Record<string, unknown>;
    if (eventData?.creator_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden: you can only check in attendees for your own events" },
        { status: 403 }
      );
    }

    // Check if already checked in
    if (action === "checkin" && ticketRow.checked_in) {
      return NextResponse.json(
        { success: false, error: "Ticket already checked in" },
        { status: 400 }
      );
    }

    // Update checked_in and checked_in_at fields
    const updateData =
      action === "checkin"
        ? { checked_in: true, checked_in_at: new Date().toISOString() }
        : { checked_in: false, checked_in_at: null };

    const { data: updatedRow, error: updateError } = await serviceClient
      .from("tickets")
      .update(updateData)
      .eq("id", ticketId)
      .select("*")
      .single();

    if (updateError || !updatedRow) {
      console.error("Error updating ticket:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to update ticket" },
        { status: 500 }
      );
    }

    const updatedTicket: Ticket = {
      id: updatedRow.id,
      orderId: updatedRow.order_id,
      eventId: updatedRow.event_id,
      productId: "",
      buyerEmail: updatedRow.buyer_email ?? "",
      buyerName: updatedRow.buyer_name ?? "",
      qrCode: updatedRow.qr_code_data ?? "",
      checkedIn: updatedRow.checked_in ?? false,
      checkedInAt: updatedRow.checked_in_at ?? null,
      createdAt: updatedRow.created_at ?? new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: updatedTicket,
    });
  } catch (error) {
    console.error("Error in tickets POST:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
