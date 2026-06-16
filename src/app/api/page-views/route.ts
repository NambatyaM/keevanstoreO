// ============================================================
// POST /api/page-views — Record page view
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { isUsingMockData } from "@/lib/mock-data";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientId } from "@/lib/rate-limit";
import type { PageView } from "@/types";

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 30 page view requests per minute per IP
    const clientId = getClientId(request);
    const rateLimit = checkRateLimit(`page-views:${clientId}`, 30, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ success: true }); // Silently acknowledge, don't error
    }

    const { creatorId, page, referrer, productId } = await request.json();

    if (!creatorId || !page) {
      return NextResponse.json(
        { success: false, error: "creator_id and page are required" },
        { status: 400 }
      );
    }

    // In mock mode, just acknowledge the view
    if (isUsingMockData()) {
      const pageView: PageView = {
        id: `pv-${Date.now()}`,
        creatorId,
        page,
        referrer: referrer || null,
        createdAt: new Date().toISOString(),
      };

      return NextResponse.json({ success: true, data: pageView });
    }

    // Real Supabase insert
    const serviceClient = createServiceRoleClient();
    if (!serviceClient) {
      // Fallback to just acknowledging if service client not available
      return NextResponse.json({ success: true });
    }

    const insertData: Record<string, unknown> = {
      creator_id: creatorId,
      view_type: page,
      referrer: referrer || null,
    };

    if (productId) {
      insertData.product_id = productId;
    }

    // Generate a SHA-256 hash of the viewer's IP for privacy-preserving deduplication
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";
    const encoder = new TextEncoder();
    const data = encoder.encode(ip + (process.env.NEXTAUTH_SECRET || "keevan-page-view-salt-v1"));
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const viewerIpHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    insertData.viewer_ip_hash = viewerIpHash;

    const { error } = await serviceClient
      .from("page_views")
      .insert(insertData);

    if (error) {
      console.error("Error inserting page view:", error);
      // Don't fail the request, just log the error
    }

    // Also increment creator total_views atomically
    const { error: viewUpdateError } = await serviceClient.rpc("increment_creator_views", { p_creator_id: creatorId });
    if (viewUpdateError) {
      // Fallback: direct update if RPC doesn't exist
      console.error("RPC increment_creator_views failed:", viewUpdateError.message);
      const { data: creatorRow } = await serviceClient
        .from("creators")
        .select("total_views")
        .eq("id", creatorId)
        .single();
      if (creatorRow) {
        await serviceClient
          .from("creators")
          .update({ total_views: Number(creatorRow.total_views) + 1 })
          .eq("id", creatorId);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in page-views POST:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
