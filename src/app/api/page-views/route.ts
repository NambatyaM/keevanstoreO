// ============================================================
// POST /api/page-views — Record page view
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { isUsingMockData } from "@/lib/mock-data";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { PageView } from "@/types";

export async function POST(request: NextRequest) {
  try {
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

    // Generate a hash of the viewer's IP for deduplication
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";
    const viewerIpHash = Buffer.from(ip).toString("base64");
    insertData.viewer_ip_hash = viewerIpHash;

    const { error } = await serviceClient
      .from("page_views")
      .insert(insertData);

    if (error) {
      console.error("Error inserting page view:", error);
      // Don't fail the request, just log the error
    }

    // Also increment creator total_views
    const { data: creatorRow } = await serviceClient
      .from("creators")
      .select("total_views")
      .eq("id", creatorId)
      .single();

    if (creatorRow) {
      await serviceClient
        .from("creators")
        .update({
          total_views: Number(creatorRow.total_views) + 1,
        })
        .eq("id", creatorId);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
