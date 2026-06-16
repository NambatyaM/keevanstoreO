-- ============================================================
-- Migration: RPC helper functions for payment & withdrawal processing
-- These functions are called by the API routes (server-side only).
-- They run with SECURITY DEFINER so they bypass RLS and can update
-- protected fields like balance and total_earnings.
-- ============================================================

-- ── process_completed_payment ───────────────────────────────
-- Called by /api/pesapal/ipn when Pesapal confirms a payment.
-- Atomically:
--   1. Marks the order as completed
--   2. Records the Pesapal transaction ID
--   3. Increments creator balance, total_earnings, and total_sales
--   4. Increments product sales_count
--   5. Increments event tickets_sold (for event products)
--
-- Idempotent: calling it twice on the same order is safe (no-op on 2nd call).
CREATE OR REPLACE FUNCTION process_completed_payment(
  p_order_id UUID,
  p_pesapal_transaction_id TEXT
)
RETURNS void AS $$
DECLARE
  v_order RECORD;
BEGIN
  -- Lock the order row to prevent concurrent IPN processing
  SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;

  -- Idempotency: if already completed, do nothing
  IF v_order.status = 'completed' THEN
    RETURN;
  END IF;

  -- 1. Update order to completed
  UPDATE orders
  SET
    status                   = 'completed',
    pesapal_transaction_id   = p_pesapal_transaction_id,
    updated_at               = now()
  WHERE id = p_order_id;

  -- 2. Credit creator balance and earnings
  UPDATE creators
  SET
    balance        = balance + v_order.creator_earning,
    total_earnings = total_earnings + v_order.creator_earning,
    total_sales    = total_sales + 1
  WHERE id = v_order.creator_id;

  -- 3. Increment product sales count
  IF v_order.product_id IS NOT NULL THEN
    UPDATE products
    SET sales_count = sales_count + 1
    WHERE id = v_order.product_id;

    -- 4. For event products, also increment tickets_sold on both products and events tables
    UPDATE products
    SET tickets_sold = tickets_sold + 1
    WHERE id = v_order.product_id
      AND type = 'event';

    UPDATE events
    SET tickets_sold = tickets_sold + 1
    WHERE product_id = v_order.product_id
      AND EXISTS (
        SELECT 1 FROM products WHERE id = v_order.product_id AND type = 'event'
      );
  END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── process_withdrawal_approval ─────────────────────────────
-- Called by /api/admin/withdrawals (PATCH) when admin approves a withdrawal.
-- Atomically:
--   1. Checks the withdrawal is still in 'pending' state
--   2. Deducts the amount from the creator's balance
--   3. Verifies sufficient balance exists (raises exception if not)
--   4. Sets withdrawal status to 'approved' with a timestamp
--
-- Idempotent: raises exception if withdrawal is not pending (prevents double-processing).
CREATE OR REPLACE FUNCTION process_withdrawal_approval(
  p_withdrawal_id UUID,
  p_admin_notes   TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_withdrawal RECORD;
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

  -- Deduct from creator balance — fail if insufficient funds
  UPDATE creators
  SET balance = balance - v_withdrawal.amount
  WHERE id = v_withdrawal.creator_id
    AND balance >= v_withdrawal.amount;

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

  IF v_rows_updated = 0 THEN
    RAISE EXCEPTION 'Insufficient balance for creator % (requested: %)',
      v_withdrawal.creator_id, v_withdrawal.amount;
  END IF;

  -- Mark withdrawal as approved
  UPDATE withdrawals
  SET
    status       = 'approved',
    admin_notes  = p_admin_notes,
    processed_at = now()
  WHERE id = p_withdrawal_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
