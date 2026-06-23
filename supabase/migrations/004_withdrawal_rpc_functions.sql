-- ============================================================
-- Migration: RPC functions for withdrawal request processing
-- These functions fix the missing RPC functions that are called
-- by the withdrawal API routes but don't exist in the schema.
-- ============================================================

-- ── process_withdrawal_request ───────────────────────────────
-- Called by /api/withdrawals (POST) when a creator requests a withdrawal.
-- Atomically:
--   1. Validates sufficient balance
--   2. Creates pending withdrawal record
--   3. DOES NOT deduct balance (balance is deducted only on approval)
--
-- This prevents race conditions and ensures balance is only deducted
-- when the withdrawal is actually approved by an admin.
CREATE OR REPLACE FUNCTION process_withdrawal_request(
  p_creator_id UUID,
  p_amount NUMERIC,
  p_phone_number TEXT,
  p_provider TEXT
)
RETURNS void AS $$
DECLARE
  v_balance NUMERIC;
  v_withdrawal_id UUID;
BEGIN
  -- Lock creator row to prevent concurrent withdrawal requests
  SELECT balance INTO v_balance FROM creators WHERE id = p_creator_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Creator not found: %', p_creator_id;
  END IF;

  -- Validate sufficient balance
  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance for creator % (balance: %, requested: %)',
      p_creator_id, v_balance, p_amount;
  END IF;

  -- Create withdrawal record with status 'pending'
  -- Balance is NOT deducted here - only when approved
  INSERT INTO withdrawals (
    creator_id,
    amount,
    method,
    account_details,
    status,
    requested_at
  ) VALUES (
    p_creator_id,
    p_amount,
    p_provider,
    jsonb_build_object(
      'phoneNumber', p_phone_number,
      'provider', p_provider
    ),
    'pending',
    now()
  );

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── refund_withdrawal ─────────────────────────────────────────
-- Called by /api/admin/withdrawals (PATCH) when a withdrawal is rejected.
-- Atomically:
--   1. Validates withdrawal is in pending status
--   2. Refunds the amount back to creator's balance
--   3. Updates withdrawal status to rejected
--
-- This ensures that if a withdrawal request was created with balance deduction
-- (which it shouldn't be with the new process_withdrawal_request), the balance
-- is properly refunded on rejection.
CREATE OR REPLACE FUNCTION refund_withdrawal(
  p_withdrawal_id UUID
)
RETURNS void AS $$
DECLARE
  v_withdrawal RECORD;
  v_creator_id UUID;
  v_amount NUMERIC;
BEGIN
  -- Lock withdrawal row
  SELECT * INTO v_withdrawal FROM withdrawals WHERE id = p_withdrawal_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal not found: %', p_withdrawal_id;
  END IF;

  -- Only refund pending withdrawals
  IF v_withdrawal.status != 'pending' THEN
    RAISE EXCEPTION 'Withdrawal % is not in pending status (current: %)',
      p_withdrawal_id, v_withdrawal.status;
  END IF;

  v_creator_id := v_withdrawal.creator_id;
  v_amount := v_withdrawal.amount;

  -- Refund balance atomically
  UPDATE creators
  SET balance = balance + v_amount
  WHERE id = v_creator_id;

  -- Update withdrawal status to rejected
  UPDATE withdrawals
  SET status = 'rejected',
      processed_at = now()
  WHERE id = p_withdrawal_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── process_withdrawal_completion ───────────────────────────────
-- Called by /api/admin/withdrawals (PATCH) when a withdrawal is approved.
-- Atomically:
--   1. Validates withdrawal is in pending status
--   2. Deducts amount from creator's balance
--   3. Updates withdrawal status to completed
--
-- This is the correct pattern: balance is deducted only on approval,
-- not at request time.
CREATE OR REPLACE FUNCTION process_withdrawal_completion(
  p_withdrawal_id UUID
)
RETURNS void AS $$
DECLARE
  v_withdrawal RECORD;
  v_creator_id UUID;
  v_amount NUMERIC;
  v_rows_updated INT;
BEGIN
  -- Lock withdrawal row
  SELECT * INTO v_withdrawal FROM withdrawals WHERE id = p_withdrawal_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal not found: %', p_withdrawal_id;
  END IF;

  -- Only process pending withdrawals
  IF v_withdrawal.status != 'pending' THEN
    RAISE EXCEPTION 'Withdrawal % is not pending (current status: %)',
      p_withdrawal_id, v_withdrawal.status;
  END IF;

  v_creator_id := v_withdrawal.creator_id;
  v_amount := v_withdrawal.amount;

  -- Deduct from creator balance — fail if insufficient funds
  UPDATE creators
  SET balance = balance - v_amount
  WHERE id = v_creator_id
    AND balance >= v_amount;

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

  IF v_rows_updated = 0 THEN
    RAISE EXCEPTION 'Insufficient balance for creator % (requested: %)',
      v_creator_id, v_amount;
  END IF;

  -- Mark withdrawal as completed
  UPDATE withdrawals
  SET status = 'completed',
      processed_at = now()
  WHERE id = p_withdrawal_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
