// ============================================================
// Withdrawal Flow Tests — State Machine & Balance Rules
// ============================================================
import { describe, it, expect, beforeEach } from 'vitest';
import { MIN_WITHDRAWAL_AMOUNT } from '@/lib/constants';
import type { Withdrawal, WithdrawalStatus, Creator } from '@/types';

// ── Simulated withdrawal state machine (mirrors production logic) ──

interface SimulatedState {
  creators: Creator[];
  withdrawals: Withdrawal[];
}

function createInitialState(): SimulatedState {
  return {
    creators: [
      {
        id: 'creator-1',
        email: 'sarah@keevan.store',
        username: 'sarah-creates',
        displayName: 'Sarah Creates',
        bio: '',
        photoUrl: null,
        bannerUrl: null,
        socialLinks: [],
        donationsEnabled: false,
        donationGoal: null,
        donationCurrent: 0,
        balance: 347500,
        totalEarnings: 1850000,
        totalSales: 42,
        totalViews: 3820,
        isAdmin: true,
        createdAt: '2025-06-15T10:00:00Z',
        updatedAt: '2026-03-01T14:30:00Z',
      },
      {
        id: 'creator-2',
        email: 'james@keevan.store',
        username: 'james-beats',
        displayName: 'James Beats',
        bio: '',
        photoUrl: null,
        bannerUrl: null,
        socialLinks: [],
        donationsEnabled: false,
        donationGoal: null,
        donationCurrent: 0,
        balance: 520000,
        totalEarnings: 3200000,
        totalSales: 78,
        totalViews: 5100,
        isAdmin: false,
        createdAt: '2025-04-10T08:00:00Z',
        updatedAt: '2026-03-02T09:15:00Z',
      },
    ],
    withdrawals: [],
  };
}

// Simulate requesting a withdrawal (POST /api/withdrawals)
function requestWithdrawal(
  state: SimulatedState,
  creatorId: string,
  amount: number,
  phoneNumber: string,
  provider: string
): { success: boolean; error?: string; withdrawal?: Withdrawal } {
  const creator = state.creators.find((c) => c.id === creatorId);
  if (!creator) {
    return { success: false, error: 'Creator not found' };
  }

  if (typeof amount !== 'number' || amount < MIN_WITHDRAWAL_AMOUNT) {
    return {
      success: false,
      error: `Minimum withdrawal amount is UGX ${MIN_WITHDRAWAL_AMOUNT.toLocaleString()}`,
    };
  }

  if (creator.balance < amount) {
    return { success: false, error: 'Insufficient balance' };
  }

  // Create withdrawal with status='pending'
  // DO NOT deduct balance yet (only when admin approves)
  const withdrawal: Withdrawal = {
    id: `wd-${Date.now()}`,
    creatorId,
    amount,
    status: 'pending' as WithdrawalStatus,
    phoneNumber,
    provider,
    createdAt: new Date().toISOString(),
    processedAt: null,
  };

  state.withdrawals.push(withdrawal);
  return { success: true, withdrawal };
}

// Simulate admin approving a withdrawal (PATCH /api/admin/withdrawals)
function approveWithdrawal(
  state: SimulatedState,
  withdrawalId: string
): { success: boolean; error?: string } {
  const withdrawalIndex = state.withdrawals.findIndex(
    (w) => w.id === withdrawalId
  );
  if (withdrawalIndex < 0) {
    return { success: false, error: 'Withdrawal not found' };
  }

  const withdrawal = state.withdrawals[withdrawalIndex];

  // Update withdrawal status
  state.withdrawals[withdrawalIndex] = {
    ...withdrawal,
    status: 'approved' as WithdrawalStatus,
    processedAt: new Date().toISOString(),
  };

  // Deduct from creator balance
  const creatorIndex = state.creators.findIndex(
    (c) => c.id === withdrawal.creatorId
  );
  if (creatorIndex >= 0) {
    state.creators[creatorIndex].balance -= withdrawal.amount;
  }

  return { success: true };
}

// Simulate admin rejecting a withdrawal (PATCH /api/admin/withdrawals)
function rejectWithdrawal(
  state: SimulatedState,
  withdrawalId: string
): { success: boolean; error?: string } {
  const withdrawalIndex = state.withdrawals.findIndex(
    (w) => w.id === withdrawalId
  );
  if (withdrawalIndex < 0) {
    return { success: false, error: 'Withdrawal not found' };
  }

  const withdrawal = state.withdrawals[withdrawalIndex];

  // Reject withdrawal
  state.withdrawals[withdrawalIndex] = {
    ...withdrawal,
    status: 'rejected' as WithdrawalStatus,
    processedAt: new Date().toISOString(),
  };

  // No balance deduction on rejection

  return { success: true };
}

// ── Tests ────────────────────────────────────────────────────────

describe('Withdrawal State Machine', () => {
  let state: SimulatedState;

  beforeEach(() => {
    state = createInitialState();
  });

  it('Pending → Approved (balance deducted)', () => {
    const creator = state.creators[0];
    const initialBalance = creator.balance;
    const withdrawalAmount = 100000;

    const { success, withdrawal } = requestWithdrawal(
      state,
      creator.id,
      withdrawalAmount,
      '256700000001',
      'MTN Mobile Money'
    );
    expect(success).toBe(true);
    expect(withdrawal).toBeDefined();
    expect(withdrawal!.status).toBe('pending');

    // Approve
    const approveResult = approveWithdrawal(state, withdrawal!.id);
    expect(approveResult.success).toBe(true);

    // Check balance deducted
    expect(creator.balance).toBe(initialBalance - withdrawalAmount);

    // Check withdrawal status
    const updated = state.withdrawals.find((w) => w.id === withdrawal!.id);
    expect(updated!.status).toBe('approved');
  });

  it('Pending → Rejected (balance NOT deducted)', () => {
    const creator = state.creators[0];
    const initialBalance = creator.balance;
    const withdrawalAmount = 100000;

    const { success, withdrawal } = requestWithdrawal(
      state,
      creator.id,
      withdrawalAmount,
      '256700000001',
      'MTN Mobile Money'
    );
    expect(success).toBe(true);

    // Reject
    const rejectResult = rejectWithdrawal(state, withdrawal!.id);
    expect(rejectResult.success).toBe(true);

    // Balance NOT deducted
    expect(creator.balance).toBe(initialBalance);

    // Check withdrawal status
    const updated = state.withdrawals.find((w) => w.id === withdrawal!.id);
    expect(updated!.status).toBe('rejected');
  });

  it('Approved withdrawal deducts exact amount from creator balance', () => {
    const creator = state.creators[0];
    const initialBalance = creator.balance;
    const withdrawalAmount = 200000;

    const { withdrawal } = requestWithdrawal(
      state,
      creator.id,
      withdrawalAmount,
      '256700000001',
      'MTN Mobile Money'
    );

    approveWithdrawal(state, withdrawal!.id);

    expect(creator.balance).toBe(initialBalance - withdrawalAmount);
    expect(creator.balance).toBe(initialBalance - 200000);
  });

  it('Creator cannot withdraw more than balance', () => {
    const creator = state.creators[0];
    const excessiveAmount = creator.balance + 1;

    const result = requestWithdrawal(
      state,
      creator.id,
      excessiveAmount,
      '256700000001',
      'MTN Mobile Money'
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('Insufficient balance');
    expect(state.withdrawals.length).toBe(0);
  });

  it('Creator cannot withdraw below MIN_WITHDRAWAL_AMOUNT (50000)', () => {
    expect(MIN_WITHDRAWAL_AMOUNT).toBe(50000);

    const creator = state.creators[0];
    const result = requestWithdrawal(
      state,
      creator.id,
      49000,
      '256700000001',
      'MTN Mobile Money'
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Minimum withdrawal amount');
  });

  it('Creator can withdraw exactly MIN_WITHDRAWAL_AMOUNT', () => {
    const creator = state.creators[0];
    const result = requestWithdrawal(
      state,
      creator.id,
      MIN_WITHDRAWAL_AMOUNT,
      '256700000001',
      'MTN Mobile Money'
    );

    expect(result.success).toBe(true);
  });

  it('Rejected withdrawal does NOT affect balance', () => {
    const creator = state.creators[0];
    const initialBalance = creator.balance;

    const { withdrawal } = requestWithdrawal(
      state,
      creator.id,
      100000,
      '256700000001',
      'MTN Mobile Money'
    );

    // Before rejection, balance unchanged (pending)
    expect(creator.balance).toBe(initialBalance);

    // Reject
    rejectWithdrawal(state, withdrawal!.id);

    // After rejection, still unchanged
    expect(creator.balance).toBe(initialBalance);
  });

  it('Withdrawal request does NOT immediately reduce balance', () => {
    const creator = state.creators[0];
    const initialBalance = creator.balance;

    requestWithdrawal(
      state,
      creator.id,
      100000,
      '256700000001',
      'MTN Mobile Money'
    );

    // Balance should still be the same after creating the request
    expect(creator.balance).toBe(initialBalance);
  });

  it('Multiple withdrawals: only approved ones deduct balance', () => {
    const creator = state.creators[1]; // james with 520000
    const initialBalance = creator.balance;

    const { withdrawal: w1 } = requestWithdrawal(
      state,
      creator.id,
      100000,
      '256700000002',
      'Airtel Money'
    );

    const { withdrawal: w2 } = requestWithdrawal(
      state,
      creator.id,
      200000,
      '256700000002',
      'Airtel Money'
    );

    // No deduction yet
    expect(creator.balance).toBe(initialBalance);

    // Approve first, reject second
    approveWithdrawal(state, w1!.id);
    rejectWithdrawal(state, w2!.id);

    // Only first withdrawal deducted
    expect(creator.balance).toBe(initialBalance - 100000);
  });

  it('Cannot approve a non-existent withdrawal', () => {
    const result = approveWithdrawal(state, 'non-existent-id');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Withdrawal not found');
  });

  it('Cannot reject a non-existent withdrawal', () => {
    const result = rejectWithdrawal(state, 'non-existent-id');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Withdrawal not found');
  });
});
