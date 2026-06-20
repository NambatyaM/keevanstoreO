// ============================================================
// GET /api/health/storage — Check R2 storage configuration
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { getR2ConfigStatus, isR2Ready } from "@/lib/r2";

export async function GET(request: NextRequest) {
  try {
    const status = getR2ConfigStatus();
    const isReady = isR2Ready();

    return NextResponse.json({
      success: true,
      data: {
        storage: "r2",
        configured: status.configured,
        ready: isReady,
        missing: status.missing,
        details: status.details,
      },
    });
  } catch (error) {
    console.error("Error in storage health check:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check storage configuration",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
