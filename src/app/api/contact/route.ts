// ============================================================
// POST /api/contact — Submit a contact form message
// Stores the message in Supabase and logs for admin review
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { isUsingMockData } from "@/lib/mock-data";
import { createServiceRoleClient } from "@/lib/supabase/server";

// In-memory store for mock mode (resets on server restart)
const mockContactMessages: Array<{
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}> = [];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Name is required" },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || email.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 400 }
      );
    }

    // Length limits to prevent abuse
    if (name.trim().length > 200) {
      return NextResponse.json(
        { success: false, error: "Name is too long (max 200 characters)" },
        { status: 400 }
      );
    }

    if (message.trim().length > 5000) {
      return NextResponse.json(
        { success: false, error: "Message is too long (max 5,000 characters)" },
        { status: 400 }
      );
    }

    if (subject && subject.trim().length > 300) {
      return NextResponse.json(
        { success: false, error: "Subject is too long (max 300 characters)" },
        { status: 400 }
      );
    }

    const sanitizedData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: (subject || "").trim(),
      message: message.trim(),
    };

    // Mock mode: store in memory and log
    if (isUsingMockData()) {
      const contactMessage = {
        id: `msg-${Date.now()}`,
        ...sanitizedData,
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      mockContactMessages.push(contactMessage);

      // Log to server console so you can see messages during development
      console.log("📧 New contact form message (mock mode):");
      console.log(`   From: ${contactMessage.name} <${contactMessage.email}>`);
      console.log(`   Subject: ${contactMessage.subject || "(no subject)"}`);
      console.log(`   Message: ${contactMessage.message.substring(0, 100)}${contactMessage.message.length > 100 ? "..." : ""}`);

      return NextResponse.json({
        success: true,
        data: { id: contactMessage.id },
      });
    }

    // Real Supabase: store in contact_messages table
    const serviceClient = createServiceRoleClient();
    if (!serviceClient) {
      return NextResponse.json(
        { success: false, error: "Server is not configured. Please try again later." },
        { status: 500 }
      );
    }

    const { data, error } = await serviceClient
      .from("contact_messages")
      .insert({
        name: sanitizedData.name,
        email: sanitizedData.email,
        subject: sanitizedData.subject,
        message: sanitizedData.message,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error saving contact message:", error);
      return NextResponse.json(
        { success: false, error: "Failed to send message. Please try again." },
        { status: 500 }
      );
    }

    // Log to server console as a backup notification
    console.log("📧 New contact form message:");
    console.log(`   From: ${sanitizedData.name} <${sanitizedData.email}>`);
    console.log(`   Subject: ${sanitizedData.subject || "(no subject)"}`);
    console.log(`   ID: ${data.id}`);

    // TODO: When Resend is configured, send email notification to admin
    // await sendEmail({
    //   to: "support@keevanstore.in",
    //   subject: `New Contact Message: ${sanitizedData.subject || "No Subject"}`,
    //   body: `From: ${sanitizedData.name} (${sanitizedData.email})\n\n${sanitizedData.message}`,
    // });

    return NextResponse.json({
      success: true,
      data: { id: data.id },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}

// GET /api/contact — Admin: list all contact messages (for future admin panel)
export async function GET(request: NextRequest) {
  try {
    const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "20");
    const unreadOnly = request.nextUrl.searchParams.get("unread") === "true";

    if (isUsingMockData()) {
      let messages = [...mockContactMessages].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      if (unreadOnly) {
        messages = messages.filter((m) => !m.isRead);
      }

      return NextResponse.json({
        success: true,
        data: messages.slice((page - 1) * limit, page * limit),
        total: messages.length,
        unread: messages.filter((m) => !m.isRead).length,
      });
    }

    const serviceClient = createServiceRoleClient();
    if (!serviceClient) {
      return NextResponse.json(
        { success: false, error: "Server not configured" },
        { status: 500 }
      );
    }

    let query = serviceClient
      .from("contact_messages")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (unreadOnly) {
      query = query.eq("is_read", false);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching contact messages:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch messages" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      total: count || 0,
      unread: (data || []).filter((m: { is_read: boolean }) => !m.is_read).length,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
