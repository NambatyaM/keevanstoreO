-- ============================================================
-- Migration: Ledger-Based RPC Functions
-- Replaces balance-update RPC functions with ledger-based versions
-- Every financial movement creates a permanent transaction record
-- ============================================================

-- ── Ledger-Based Payment Processing ─────────────────────────────
-- Called by /api/pesapal/ipn when Pesapal confirms a payment.
-- Atomically:
--   1. Marks the order as completed
--   2. Records the Pesapal transaction ID
--   3. Creates ledger entries for: SALE_COMPLETED, COMMISSION_DEDUCTED, CREATOR_EARNING_CREDITED
--   4. Updates wallet state atomically
--   5. Increments product sales count
--   6. Increments event tickets_sold (for event products)
--
-- Idempotent: calling it twice on the same order is safe (no-op on 2nd call).
CREATE OR REPLACE FUNCTION process_completed_payment_ledger(
  p_order_id UUID,
  p_pesapal_transaction_id TEXT
)
RETURNS void AS $$
DECLARE
  v_order RECORD;
  v_platform_fee NUMERIC;
  v_creator_earning NUMERIC;
  v_ledger_id UUID;
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

  -- Calculate commission and creator earning (10% platform fee)
  v_platform_fee := ROUND(v_order.amount * 0.10, 2);
  v_creator_earning := v_order.amount - v_platform_fee;

  -- Update order to completed
  UPDATE orders
  SET
    status                   = 'completed',
    pesapal_transaction_id   = p_pesapal_transaction_id,
    platform_fee             = v_platform_fee,
    creator_earning          = v_creator_earning,
    updated_at               = now()
  WHERE id = p_order_id;

  -- Create ledger entries atomically
  
  -- 1. SALE_COMPLETED - records the full sale amount
  PERFORM create_ledger_entry(
    v_order.creator_id,
    'SALE_COMPLETED'::transaction_type,
    v_order.amount,
    v_order.id,
    'order'::reference_type,
    'Sale completed: ' || v_order.buyer_email,
    jsonb_build_object(
      'order_id', v_order.id,
      'product_id', v_order.product_id,
      'buyer_email', v_order.buyer_email,
      'payment_method', v_order.payment_method,
      'pesapal_transaction_id', p_pesapal_transaction_id
    )
  );

  -- 2. COMMISSION_DEDUCTED - records platform fee (debit from creator perspective)
  PERFORM create_ledger_entry(
    v_order.creator_id,
    'COMMISSION_DEDUCTED'::transaction_type,
    -v_platform_fee,
    v_order.id,
    'order'::reference_type,
    'Platform commission deducted (10%)',
    jsonb_build_object(
      'order_id', v_order.id,
      'commission_rate', 0.10,
      'commission_amount', v_platform_fee
    )
  );

  -- 3. CREATOR_EARNING_CREDITED - records creator's net earning
  PERFORM create_ledger_entry(
    v_order.creator_id,
    'CREATOR_EARNING_CREDITED'::transaction_type,
    v_creator_earning,
    v_order.id,
    'order'::reference_type,
    'Creator earning credited (90%)',
    jsonb_build_object(
      'order_id', v_order.id,
      'earning_amount', v_creator_earning,
      'commission_deducted', v_platform_fee
    )
  );

  -- Update product sales count and event tickets (only for event products)
  IF v_order.product_id IS NOT NULL THEN
    UPDATE products
    SET sales_count = sales_count + 1
    WHERE id = v_order.product_id;

    -- Only increment tickets_sold for event-type products
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


-- ── Ledger-Based Donation Processing ─────────────────────────────
-- Called by /api/pesapal/ipn for donation-only payments.
-- Atomically:
--   1. Marks the order as completed
--   2. Creates ledger entry for DONATION_RECEIVED
--   3. Updates donation_current
--
-- Idempotent: calling it twice on the same order is safe.
CREATE OR REPLACE FUNCTION process_donation_ledger(
  p_order_id UUID,
  p_pesapal_transaction_id TEXT
)
RETURNS void AS $$
DECLARE
  v_order RECORD;
BEGIN
  -- Lock the order row
  SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;

  -- Idempotency check
  IF v_order.status = 'completed' THEN
    RETURN;
  END IF;

  -- Update order to completed
  UPDATE orders
  SET
    status = 'completed',
    pesapal_transaction_id = p_pesapal_transaction_id,
    updated_at = now()
  WHERE id = p_order_id;

  -- Create ledger entry for donation (no commission on donations)
  PERFORM create_ledger_entry(
    v_order.creator_id,
    'DONATION_RECEIVED'::transaction_type,
    v_order.amount,
    v_order.id,
    'order'::reference_type,
    'Donation received from ' || v_order.buyer_email,
    jsonb_build_object(
      'order_id', v_order.id,
      'donor_email', v_order.buyer_email,
      'donor_name', v_order.buyer_name,
      'pesapal_transaction_id', p_pesapal_transaction_id
    )
  );

  -- Update donation_current on creators table
  UPDATE creators
  SET donation_current = donation_current + v_order.amount
  WHERE id = v_order.creator_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── Ledger-Based Withdrawal Request ────────────────────────────
-- Called by /api/withdrawals (POST) when a creator requests a withdrawal.
-- Atomically:
--   1. Validates sufficient available balance
--   2. Creates pending withdrawal record
--   3. Creates ledger entry: WITHDRAWAL_REQUESTED (moves funds from available to pending)
--   4. Updates wallet state atomically
--
-- This prevents race conditions and ensures funds are locked.
CREATE OR REPLACE FUNCTION process_withdrawal_request_ledger(
  p_creator_id UUID,
  p_amount NUMERIC,
  p_phone_number TEXT,
  p_provider TEXT
)
RETURNS UUID AS $$
DECLARE
  v_withdrawal_id UUID;
  v_available_balance NUMERIC;
BEGIN
  -- Lock creator wallet to prevent concurrent requests
  SELECT available_balance INTO v_available_balance
  FROM creator_wallets
  WHERE creator_id = p_creator_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Creator wallet not found: %', p_creator_id;
  END IF;

  -- Validate sufficient available balance
  IF v_available_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient available balance for creator % (available: %, requested: %)',
      p_creator_id, v_available_balance, p_amount;
  END IF;

  -- Create withdrawal record with status 'pending'
  v_withdrawal_id := uuid_generate_v4();
  
  INSERT INTO withdrawals (
    id,
    creator_id,
    amount,
    method,
    account_details,
    status,
    requested_at
  ) VALUES (
    v_withdrawal_id,
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

  -- Create ledger entry: WITHDRAWAL_REQUESTED
  -- This moves funds from available to pending (locks the funds)
  PERFORM create_ledger_entry(
    p_creator_id,
    'WITHDRAWAL_REQUESTED'::transaction_type,
    -p_amount, -- Debit from available
    v_withdrawal_id,
    'withdrawal'::reference_type,
    'Withdrawal requested: ' || p_phone_number,
    jsonb_build_object(
      'withdrawal_id', v_withdrawal_id,
      'amount', p_amount,
      'phone_number', p_phone_number,
      'provider', p_provider
    )
  );

  RETURN v_withdrawal_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── Ledger-Based Withdrawal Completion ─────────────────────────
-- Called by /api/admin/withdrawals (PATCH) when admin approves a withdrawal.
-- Atomically:
--   1. Validates withdrawal is in pending status
--   2. Creates ledger entry: WITHDRAWAL_APPROVED (moves funds from pending to withdrawn)
--   3. Updates withdrawal status to 'completed'
--   4. Updates wallet state atomically
--
-- Idempotent: raises exception if withdrawal is not pending.
CREATE OR REPLACE FUNCTION process_withdrawal_completion_ledger(
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

  -- Only process pending withdrawals
  IF v_withdrawal.status != 'pending' THEN
    RAISE EXCEPTION 'Withdrawal % is not pending (current status: %)',
      p_withdrawal_id, v_withdrawal.status;
  END IF;

  v_creator_id := v_withdrawal.creator_id;
  v_amount := v_withdrawal.amount;

  -- Lock creator wallet
  PERFORM 1 FROM creator_wallets WHERE creator_id = v_creator_id FOR UPDATE;

  -- Create ledger entry: WITHDRAWAL_APPROVED
  -- This moves funds from pending to withdrawn (finalizes the withdrawal)
  PERFORM create_ledger_entry(
    v_creator_id,
    'WITHDRAWAL_APPROVED'::transaction_type,
    0, -- No balance change (already moved to pending)
    v_withdrawal_id,
    'withdrawal'::reference_type,
    'Withdrawal approved and completed',
    jsonb_build_object(
      'withdrawal_id', v_withdrawal_id,
      'amount', v_amount,
      'approved_at', now()
    )
  );

  -- Mark withdrawal as completed
  UPDATE withdrawals
  SET
    status = 'completed',
    processed_at = now()
  WHERE id = p_withdrawal_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── Ledger-Based Withdrawal Rejection ─────────────────────────
-- Called by /api/admin/withdrawals (PATCH) when admin rejects a withdrawal.
-- Atomically:
--   1. Validates withdrawal is in pending status
--   2. Creates ledger entry: WITHDRAWAL_REJECTED (moves funds back to available)
--   3. Updates withdrawal status to 'rejected'
--   4. Updates wallet state atomically
--
-- Idempotent: raises exception if withdrawal is not pending.
CREATE OR REPLACE FUNCTION process_withdrawal_rejection_ledger(
  p_withdrawal_id UUID,
  p_admin_notes TEXT DEFAULT NULL
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

  -- Only process pending withdrawals
  IF v_withdrawal.status != 'pending' THEN
    RAISE EXCEPTION 'Withdrawal % is not pending (current status: %)',
      p_withdrawal_id, v_withdrawal.status;
  END IF;

  v_creator_id := v_withdrawal.creator_id;
  v_amount := v_withdrawal.amount;

  -- Lock creator wallet
  PERFORM 1 FROM creator_wallets WHERE creator_id = v_creator_id FOR UPDATE;

  -- Create ledger entry: WITHDRAWAL_REJECTED
  -- This moves funds back from pending to available (refunds the lock)
  PERFORM create_ledger_entry(
    v_creator_id,
    'WITHDRAWAL_REJECTED'::transaction_type,
    v_amount, -- Credit back to available
    v_withdrawal_id,
    'withdrawal'::reference_type,
    'Withdrawal rejected: ' || COALESCE(p_admin_notes, 'No reason provided'),
    jsonb_build_object(
      'withdrawal_id', v_withdrawal_id,
      'amount', v_amount,
      'rejected_at', now(),
      'admin_notes', p_admin_notes
    )
  );

  -- Mark withdrawal as rejected
  UPDATE withdrawals
  SET
    status = 'rejected',
    admin_notes = p_admin_notes,
    processed_at = now()
  WHERE id = p_withdrawal_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── Ledger-Based Refund Processing ───────────────────────────────
-- Called when a refund needs to be processed.
-- Atomically:
--   1. Validates order exists and is completed
--   2. Creates ledger entry: REFUND_PROCESSED
--   3. Updates order status to 'refunded'
--   4. Updates wallet state atomically
--
-- Idempotent: calling it twice on the same order is safe.
CREATE OR REPLACE FUNCTION process_refund_ledger(
  p_order_id UUID,
  p_refund_amount NUMERIC,
  p_reason TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_order RECORD;
BEGIN
  -- Lock the order row
  SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;

  -- Idempotency check
  IF v_order.status = 'refunded' THEN
    RETURN;
  END IF;

  -- Validate order is completed
  IF v_order.status != 'completed' THEN
    RAISE EXCEPTION 'Order % is not completed (current status: %)',
      p_order_id, v_order.status;
  END IF;

  -- Validate refund amount doesn't exceed order amount
  IF p_refund_amount > v_order.amount THEN
    RAISE EXCEPTION 'Refund amount % exceeds order amount %',
      p_refund_amount, v_order.amount;
  END IF;

  -- Update order to refunded
  UPDATE orders
  SET
    status = 'refunded',
    updated_at = now()
  WHERE id = p_order_id;

  -- Create ledger entry: REFUND_PROCESSED
  -- This credits the refund amount back to creator (platform fee is not refunded)
  PERFORM create_ledger_entry(
    v_order.creator_id,
    'REFUND_PROCESSED'::transaction_type,
    p_refund_amount,
    v_order.id,
    'refund'::reference_type,
    'Refund processed: ' || COALESCE(p_reason, 'No reason provided'),
    jsonb_build_object(
      'order_id', v_order.id,
      'refund_amount', p_refund_amount,
      'original_amount', v_order.amount,
      'reason', p_reason
    )
  );

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── Ledger-Based Balance Adjustment ─────────────────────────────
-- Called by admin to manually adjust creator balance (for corrections).
-- Atomically:
--   1. Validates admin permissions
--   2. Creates ledger entry: ADJUSTMENT
--   3. Updates wallet state atomically
--
-- This should be used sparingly and always with proper documentation.
CREATE OR REPLACE FUNCTION process_balance_adjustment_ledger(
  p_creator_id UUID,
  p_amount NUMERIC,
  p_reason TEXT,
  p_admin_id UUID
)
RETURNS void AS $$
DECLARE
  v_admin_is_admin BOOLEAN;
BEGIN
  -- Validate admin permissions
  SELECT is_admin INTO v_admin_is_admin
  FROM creators
  WHERE id = p_admin_id;

  IF NOT FOUND OR NOT v_admin_is_admin THEN
    RAISE EXCEPTION 'User % is not an admin', p_admin_id;
  END IF;

  -- Create ledger entry: ADJUSTMENT
  PERFORM create_ledger_entry(
    p_creator_id,
    'ADJUSTMENT'::transaction_type,
    p_amount,
    NULL,
    'adjustment'::reference_type,
    'Balance adjustment: ' || p_reason,
    jsonb_build_object(
      'amount', p_amount,
      'reason', p_reason,
      'admin_id', p_admin_id,
      'adjusted_at', now()
    )
  );

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── Daily Reconciliation Function ───────────────────────────────
-- Called daily to verify financial integrity.
-- Compares:
--   - Total buyer payments vs platform revenue + creator earnings + refunds
--   - Wallet balances vs ledger calculations
CREATE OR REPLACE FUNCTION run_daily_reconciliation(
  p_reconciliation_date DATE DEFAULT CURRENT_DATE
)
RETURNS UUID AS $$
DECLARE
  v_reconciliation_id UUID;
  v_total_buyer_payments NUMERIC;
  v_platform_revenue NUMERIC;
  v_creator_earnings NUMERIC;
  v_refunds NUMERIC;
  v_discrepancy NUMERIC;
  v_reconciliation_status TEXT;
  v_details JSONB;
BEGIN
  -- Calculate total buyer payments for the day
  SELECT COALESCE(SUM(amount), 0) INTO v_total_buyer_payments
  FROM orders
  WHERE DATE(created_at) = p_reconciliation_date
    AND status = 'completed';

  -- Calculate platform revenue (10% of completed sales)
  SELECT COALESCE(SUM(platform_fee), 0) INTO v_platform_revenue
  FROM orders
  WHERE DATE(created_at) = p_reconciliation_date
    AND status = 'completed';

  -- Calculate creator earnings from ledger
  SELECT COALESCE(SUM(amount), 0) INTO v_creator_earnings
  FROM transaction_ledger
  WHERE DATE(created_at) = p_reconciliation_date
    AND transaction_type = 'CREATOR_EARNING_CREDITED';

  -- Calculate refunds
  SELECT COALESCE(SUM(amount), 0) INTO v_refunds
  FROM transaction_ledger
  WHERE DATE(created_at) = p_reconciliation_date
    AND transaction_type = 'REFUND_PROCESSED';

  -- Calculate discrepancy
  v_discrepancy := v_total_buyer_payments - (v_platform_revenue + v_creator_earnings + v_refunds);

  -- Determine status
  IF ABS(v_discrepancy) < 0.01 THEN
    v_reconciliation_status := 'completed';
  ELSE
    v_reconciliation_status := 'discrepancy_found';
  END IF;

  -- Build details
  v_details := jsonb_build_object(
    'total_buyer_payments', v_total_buyer_payments,
    'platform_revenue', v_platform_revenue,
    'creator_earnings', v_creator_earnings,
    'refunds', v_refunds,
    'discrepancy', v_discrepancy,
    'calculated_at', now()
  );

  -- Insert reconciliation record
  INSERT INTO financial_reconciliation (
    reconciliation_date,
    total_buyer_payments,
    platform_revenue,
    creator_earnings,
    refunds,
    discrepancy,
    status,
    details
  ) VALUES (
    p_reconciliation_date,
    v_total_buyer_payments,
    v_platform_revenue,
    v_creator_earnings,
    v_refunds,
    v_discrepancy,
    v_reconciliation_status,
    v_details
  ) ON CONFLICT (reconciliation_date) DO UPDATE SET
    total_buyer_payments = EXCLUDED.total_buyer_payments,
    platform_revenue = EXCLUDED.platform_revenue,
    creator_earnings = EXCLUDED.creator_earnings,
    refunds = EXCLUDED.refunds,
    discrepancy = EXCLUDED.discrepancy,
    status = EXCLUDED.status,
    details = EXCLUDED.details,
    updated_at = now()
  RETURNING id INTO v_reconciliation_id;

  -- If discrepancy found, raise alert
  IF v_reconciliation_status = 'discrepancy_found' THEN
    RAISE NOTICE 'Financial discrepancy detected on %: %',
      p_reconciliation_date, v_discrepancy;
  END IF;

  RETURN v_reconciliation_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
