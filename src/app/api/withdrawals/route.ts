// ============================================================
// GET /api/withdrawals — Get creator's withdrawals
// POST /api/withdrawals — Request a new withdrawal
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import {
  isUsingMockData,
  getMockWithdrawals,
  getMockCreatorById,
  mockWithdrawals,
  mockCreators,
} from "@/lib/mock-data";
import { MIN_WITHDRAWAL_AMOUNT } from "@/lib/constants";
import type { Withdrawal, WithdrawalStatus } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const creatorId = request.nextUrl.searchParams.get("creator_id");

    if (!creatorId) {
      return NextResponse.json(
        { success: false, error: "creator_id is required" },
        { status: 400 }
      );
    }

    if (isUsingMockData()) {
      const withdrawals = getMockWithdrawals(creatorId).sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return NextResponse.json({
        success: true,
        data: withdrawals,
        total: withdrawals.length,
      });
    }

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { creatorId, amount, method, phoneNumber, provider } = body;

    // Validate required fields
    if (!creatorId || !amount || !phoneNumber || !provider) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: creatorId, amount, phoneNumber, provider",
        },
        { status: 400 }
      );
    }

    // Validate amount >= 50,000 UGX
    if (typeof amount !== "number" || amount < MIN_WITHDRAWAL_AMOUNT) {
      return NextResponse.json(
        {
          success: false,
          error: `Minimum withdrawal amount is UGX ${MIN_WITHDRAWAL_AMOUNT.toLocaleString()}`,
        },
        { status: 400 }
      );
    }

    if (isUsingMockData()) {
      const creator = getMockCreatorById(creatorId);
      if (!creator) {
        return NextResponse.json(
          { success: false, error: "Creator not found" },
          { status: 404 }
        );
      }

      // Validate creator has sufficient balance
      if (creator.balance < amount) {
        return NextResponse.json(
          { success: false, error: "Insufficient balance" },
          { status: 400 }
        );
      }

      // Create withdrawal with status='pending'
      // DO NOT deduct balance yet (only when admin approves)
      const withdrawal: Withdrawal = {
        id: `wd-${Date.now()}`,
        creatorId,
        amount,
        status: "pending" as WithdrawalStatus,
        phoneNumber,
        provider,
        createdAt: new Date().toISOString(),
        processedAt: null,
      };

      mockWithdrawals.push(withdrawal);

      return NextResponse.json({
        success: true,
        data: withdrawal,
      });
    }

    // Real Supabase flow
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
