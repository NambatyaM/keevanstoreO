// ============================================================
// POST /api/page-views — Record page view
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { isUsingMockData } from "@/lib/mock-data";
import type { PageView } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { creatorId, page, referrer } = await request.json();

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

    // Real Supabase insert would go here
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
