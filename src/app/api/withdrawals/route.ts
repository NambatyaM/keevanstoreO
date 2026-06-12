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
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { mapWithdrawalFromDb, mapWithdrawalToDb } from "@/lib/db-mappers";
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

    // Real Supabase query
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
      });
    }

    // Verify authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== creatorId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { data: withdrawalRows, error } = await supabase
      .from("withdrawals")
      .select("*")
      .eq("creator_id", creatorId)
      .order("requested_at", { ascending: false });

    if (error) {
      console.error("Error fetching withdrawals:", error);
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
      });
    }

    const withdrawals = (withdrawalRows || []).map((row) => mapWithdrawalFromDb(row));

    return NextResponse.json({
      success: true,
      data: withdrawals,
      total: withdrawals.length,
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

    if (!user || user.id !== creatorId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Check creator balance
    const { data: creatorRow } = await supabase
      .from("creators")
      .select("balance")
      .eq("id", creatorId)
      .single();

    if (!creatorRow) {
      return NextResponse.json(
        { success: false, error: "Creator not found" },
        { status: 404 }
      );
    }

    if (Number(creatorRow.balance) < amount) {
      return NextResponse.json(
        { success: false, error: "Insufficient balance" },
        { status: 400 }
      );
    }

    // Create withdrawal using the RLS-enabled client (creator is authenticated)
    const withdrawalData = mapWithdrawalToDb({
      creatorId,
      amount,
      phoneNumber,
      provider,
    });
    withdrawalData.status = "pending";

    const { data: withdrawalRow, error: insertError } = await supabase
      .from("withdrawals")
      .insert(withdrawalData)
      .select()
      .single();

    if (insertError || !withdrawalRow) {
      console.error("Error creating withdrawal:", insertError);
      return NextResponse.json(
        { success: false, error: "Failed to create withdrawal request" },
        { status: 500 }
      );
    }

    const withdrawal = mapWithdrawalFromDb(withdrawalRow);

    return NextResponse.json({
      success: true,
      data: withdrawal,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
