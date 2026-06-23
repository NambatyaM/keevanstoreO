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
import { notifyWithdrawalRequest } from "@/lib/notifications";
import { checkRateLimit, getClientId } from "@/lib/rate-limit";
import { createWithdrawalSchema } from "@/lib/validations";
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
  } catch (error) {
    console.error("Error in withdrawals GET:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 3 withdrawal requests per minute per IP
    const clientId = getClientId(request);
    const rateLimit = checkRateLimit(`withdrawals:${clientId}`, 3, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many withdrawal requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();

    // FIXED: Blueprint Phase 4 — Zod validation replaces manual checks
    const parsed = createWithdrawalSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { success: false, error: firstError?.message ?? "Invalid request data" },
        { status: 400 }
      );
    }

    const { creatorId, amount, method, phoneNumber, provider } = parsed.data;

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

      // Send WhatsApp notification to admin (non-blocking)
      notifyWithdrawalRequest({
        creatorName: creator.displayName,
        creatorEmail: creator.email,
        amount,
        phoneNumber,
        provider,
        withdrawalId: withdrawal.id,
      }).catch((err) => {
        console.error("Failed to send withdrawal notification:", err instanceof Error ? err.message : String(err));
      });

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

    // Use service role client for atomic withdrawal request creation
    // FIXED: process_withdrawal_request now creates pending record WITHOUT deducting balance
    // Balance is only deducted when admin approves the withdrawal
    const serviceClient = createServiceRoleClient();
    if (!serviceClient) {
      return NextResponse.json(
        { success: false, error: "Service client not available" },
        { status: 500 }
      );
    }

    // Atomic transaction: create withdrawal record using ledger-based RPC
    // This locks funds by moving them from available to pending balance
    const { error: txError } = await serviceClient.rpc("process_withdrawal_request_ledger", {
      p_creator_id: creatorId,
      p_amount: amount,
      p_phone_number: phoneNumber,
      p_provider: provider,
    });

    if (txError) {
      console.error("Error processing withdrawal request via RPC:", txError);
      return NextResponse.json(
        { success: false, error: txError.message || "Failed to create withdrawal request" },
        { status: 500 }
      );
    }

    // Fetch the created withdrawal to return
    const { data: withdrawalRow, error: fetchError } = await serviceClient
      .from("withdrawals")
      .select("*")
      .eq("creator_id", creatorId)
      .eq("amount", amount)
      .eq("status", "pending")
      .order("requested_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !withdrawalRow) {
      console.error("Error fetching created withdrawal:", fetchError);
      return NextResponse.json(
        { success: false, error: "Failed to create withdrawal request" },
        { status: 500 }
      );
    }

    const withdrawal = mapWithdrawalFromDb(withdrawalRow);

    // Get creator info for WhatsApp notification
    const { data: creatorInfo } = await supabase
      .from("creators")
      .select("display_name, email")
      .eq("id", creatorId)
      .single();

    // Send WhatsApp notification to admin (non-blocking)
    if (creatorInfo) {
      notifyWithdrawalRequest({
        creatorName: creatorInfo.display_name,
        creatorEmail: creatorInfo.email,
        amount,
        phoneNumber,
        provider,
        withdrawalId: withdrawal.id,
      }).catch((err) => {
        console.error("Failed to send withdrawal notification:", err instanceof Error ? err.message : String(err));
      });
    }

    return NextResponse.json({
      success: true,
      data: withdrawal,
    });
  } catch (error) {
    console.error("Error in withdrawals POST:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
