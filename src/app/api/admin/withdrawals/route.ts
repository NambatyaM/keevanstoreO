// ============================================================
// GET /api/admin/withdrawals — List pending withdrawals
// PATCH /api/admin/withdrawals — Approve/reject withdrawal
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import {
  isUsingMockData,
  mockWithdrawals,
  mockCreators,
} from "@/lib/mock-data";
import type { WithdrawalStatus } from "@/types";

export async function GET() {
  try {
    if (isUsingMockData()) {
      // Get all withdrawals with creator info
      const withdrawalsWithCreator = mockWithdrawals.map((w) => {
        const creator = mockCreators.find((c) => c.id === w.creatorId);
        return {
          ...w,
          creatorName: creator?.displayName || "Unknown",
          creatorUsername: creator?.username || "unknown",
        };
      });

      // Sort by newest first
      withdrawalsWithCreator.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return NextResponse.json({
        success: true,
        data: withdrawalsWithCreator,
        total: withdrawalsWithCreator.length,
      });
    }

    // Real Supabase query
    return NextResponse.json({
      success: true,
      data: [],
      total: 0,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { withdrawalId, action } = body;

    if (!withdrawalId || !action) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: withdrawalId, action" },
        { status: 400 }
      );
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Invalid action. Must be: approve or reject" },
        { status: 400 }
      );
    }

    if (isUsingMockData()) {
      const withdrawalIndex = mockWithdrawals.findIndex(
        (w) => w.id === withdrawalId
      );
      if (withdrawalIndex < 0) {
        return NextResponse.json(
          { success: false, error: "Withdrawal not found" },
          { status: 404 }
        );
      }

      const withdrawal = mockWithdrawals[withdrawalIndex];

      if (action === "approve") {
        // Update withdrawal status
        mockWithdrawals[withdrawalIndex] = {
          ...withdrawal,
          status: "approved" as WithdrawalStatus,
          processedAt: new Date().toISOString(),
        };

        // Deduct from creator balance
        const creatorIndex = mockCreators.findIndex(
          (c) => c.id === withdrawal.creatorId
        );
        if (creatorIndex >= 0) {
          mockCreators[creatorIndex].balance -= withdrawal.amount;
        }
      } else {
        // Reject withdrawal
        mockWithdrawals[withdrawalIndex] = {
          ...withdrawal,
          status: "rejected" as WithdrawalStatus,
          processedAt: new Date().toISOString(),
        };
      }

      return NextResponse.json({
        success: true,
        data: mockWithdrawals[withdrawalIndex],
      });
    }

    // Real Supabase update
    return NextResponse.json(
      { success: false, error: "Supabase not configured" },
      { status: 500 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
