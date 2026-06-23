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
import { createServiceRoleClient } from "@/lib/supabase/server";
import { mapWithdrawalFromDb } from "@/lib/db-mappers";
import { verifyAdmin } from "@/lib/auth-helpers";
import type { WithdrawalStatus } from "@/types";

export async function GET(request: NextRequest) {
  try {
    // Admin authentication check
    const adminCheck = await verifyAdmin(request);
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden: admin access required" },
        { status: 403 }
      );
    }

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

    // Real Supabase query using service role client
    const serviceClient = createServiceRoleClient();
    if (!serviceClient) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
      });
    }

    const { data: withdrawalRows, error } = await serviceClient
      .from("withdrawals")
      .select("*, creators!inner(id, display_name, username)")
      .order("requested_at", { ascending: false });

    if (error) {
      console.error("Error fetching withdrawals:", error);
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
      });
    }

    const withdrawalsWithCreator = (withdrawalRows || []).map((row) => {
      const creatorData = row.creators as Record<string, unknown>;
      const withdrawal = mapWithdrawalFromDb(row);
      return {
        ...withdrawal,
        creatorName: (creatorData?.display_name as string) || "Unknown",
        creatorUsername: (creatorData?.username as string) || "unknown",
      };
    });

    return NextResponse.json({
      success: true,
      data: withdrawalsWithCreator,
      total: withdrawalsWithCreator.length,
    });
  } catch (error) {
    console.error("Error in admin withdrawals GET:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Admin authentication check
    const adminCheck = await verifyAdmin(request);
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden: admin access required" },
        { status: 403 }
      );
    }

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

    // Real Supabase update using service role client
    const serviceClient = createServiceRoleClient();
    if (!serviceClient) {
      return NextResponse.json(
        { success: false, error: "Supabase not configured" },
        { status: 500 }
      );
    }

    if (action === "approve") {
      // FIXED: Use ledger-based process_withdrawal_completion_ledger RPC
      // This atomically moves funds from pending to withdrawn balance
      const { error: completionError } = await serviceClient.rpc("process_withdrawal_completion_ledger", {
        p_withdrawal_id: withdrawalId,
      });

      if (completionError) {
        console.error("Error completing withdrawal:", completionError);
        return NextResponse.json(
          { success: false, error: completionError.message || "Failed to approve withdrawal" },
          { status: 500 }
        );
      }

      // Fetch the updated withdrawal to return
      const { data: updatedRow, error: fetchError } = await serviceClient
        .from("withdrawals")
        .select("*")
        .eq("id", withdrawalId)
        .single();

      if (fetchError || !updatedRow) {
        console.error("Error fetching updated withdrawal:", fetchError);
        return NextResponse.json(
          { success: false, error: "Failed to fetch updated withdrawal" },
          { status: 500 }
        );
      }

      const withdrawal = mapWithdrawalFromDb(updatedRow);
      return NextResponse.json({
        success: true,
        data: withdrawal,
      });
    } else {
      // Reject withdrawal - use ledger-based process_withdrawal_rejection_ledger RPC
      // This atomically moves funds back from pending to available balance
      const { error: rejectError } = await serviceClient.rpc("process_withdrawal_rejection_ledger", {
        p_withdrawal_id: withdrawalId,
        p_admin_notes: body.admin_notes || null,
      });

      if (rejectError) {
        console.error("Error rejecting withdrawal:", rejectError);
        return NextResponse.json(
          { success: false, error: rejectError.message || "Failed to reject withdrawal" },
          { status: 500 }
        );
      }

      // Fetch the updated withdrawal to return
      const { data: updatedRow, error: fetchError } = await serviceClient
        .from("withdrawals")
        .select("*")
        .eq("id", withdrawalId)
        .single();

      if (fetchError || !updatedRow) {
        console.error("Error fetching updated withdrawal:", fetchError);
        return NextResponse.json(
          { success: false, error: "Failed to fetch updated withdrawal" },
          { status: 500 }
        );
      }

      const withdrawal = mapWithdrawalFromDb(updatedRow);
      return NextResponse.json({
        success: true,
        data: withdrawal,
      });
    }
  } catch (error) {
    console.error("Error in admin withdrawals PATCH:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
